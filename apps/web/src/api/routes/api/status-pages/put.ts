import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { StatusPageSchema, StatusPageBodySchema } from "./schemas";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { UUIDParamSchema } from "./schemas";

const route = createRoute({
  method: "put",
  path: "/status-pages/:id",
  request: {
    params: UUIDParamSchema,
    body: { content: { "application/json": { schema: StatusPageBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated",
      content: {
        "application/json": {
          schema: z.object({
            data: StatusPageSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPutStatusPage(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: statusPageId } = c.req.valid("param");
    const {
      slug,
      title,
      description,
      showValues,
      password,
      isPublic,
      monitors,
    } = c.req.valid("json");

    const { data: existingStatusPage, error: fetchError } = await supabase
      .from("status_pages")
      .select("*")
      .eq("id", statusPageId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new HTTPException(404, { message: "Status page not found" });
      }
      throw new HTTPException(500, { message: "Failed to fetch status page" });
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", existingStatusPage.workspace_id)
      .eq("user_id", userId)
      .single();

    if (!membership || membership.role === "viewer") {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    if (slug !== existingStatusPage.slug) {
      const { data: conflictingStatusPage } = await supabase
        .from("status_pages")
        .select("id")
        .eq("workspace_id", existingStatusPage.workspace_id)
        .eq("slug", slug)
        .neq("id", statusPageId)
        .single();

      if (conflictingStatusPage) {
        throw new HTTPException(400, {
          message:
            "A status page with this slug already exists in this workspace",
        });
      }
    }

    const { data: updatedStatusPage, error: updateError } = await supabase
      .from("status_pages")
      .update({
        slug,
        title,
        description: description || null,
        show_values: showValues,
        password: password || null,
        is_public: isPublic,
        monitors,
        updated_at: new Date().toISOString(),
      })
      .eq("id", statusPageId)
      .select()
      .single();

    if (updateError) {
      throw new HTTPException(500, { message: "Failed to update status page" });
    }

    return c.json({ data: updatedStatusPage, success: true, error: null });
  });
}
