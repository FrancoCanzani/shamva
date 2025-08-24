import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { StatusPageSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/status-pages/:id",
  request: {
    params: z.object({
      id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
    }),
  },
  responses: {
    200: {
      description: "OK",
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

export default function registerGetStatusPage(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: statusPageId } = c.req.valid("param");

    const { data: statusPage, error: statusPageError } = await supabase
      .from("status_pages")
      .select(
        `
        *,
        workspace:workspaces(id, name)
      `
      )
      .eq("id", statusPageId)
      .single();

    if (statusPageError) {
      if (statusPageError.code === "PGRST116") {
        throw new HTTPException(404, { message: "Status page not found" });
      }
      throw new HTTPException(500, { message: "Failed to fetch status page" });
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", statusPage.workspace_id)
      .eq("user_id", userId)
      .single();

    if (!membership) {
      throw new HTTPException(403, { message: "Access denied" });
    }

    return c.json({ data: statusPage, success: true, error: null });
  });
}
