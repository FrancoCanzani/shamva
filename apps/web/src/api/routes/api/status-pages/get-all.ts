import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { StatusPageSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/status-pages",
  request: {
    query: z.object({
      workspaceId: z
        .uuid()
        .optional()
        .openapi({
          param: { name: "workspaceId", in: "query" },
          example: "a81bc81b-dead-4e5d-abff-90865d1e13b1",
        }),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(StatusPageSchema),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetAllStatusPages(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("query");

    let query = supabase.from("status_pages").select(`
        *,
        workspace:workspaces(id, name)
      `);

    if (workspaceId) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .single();

      if (!membership) {
        return c.json({ data: [], success: true, error: null });
      }

      query = query.eq("workspace_id", workspaceId);
    } else {
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId);

      if (!memberships || memberships.length === 0) {
        return c.json({ data: [], success: true, error: null });
      }

      const workspaceIds = memberships.map((m) => m.workspace_id);
      query = query.in("workspace_id", workspaceIds);
    }

    const { data: statusPages, error: statusPagesError } = await query.order(
      "created_at",
      { ascending: false }
    );

    if (statusPagesError) {
      throw new HTTPException(500, { message: "Failed to fetch status pages" });
    }

    return c.json({ data: statusPages ?? [], success: true, error: null });
  });
}
