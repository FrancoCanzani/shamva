import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { UUIDParamSchema, WorkspaceWithMembersSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/workspaces/:id",
  request: { params: UUIDParamSchema },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: WorkspaceWithMembersSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetWorkspace(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: workspaceId } = c.req.valid("param");

    const { data, error } = await supabase
      .from("workspaces")
      .select(
        `
        *,
        workspace_members (
          id,
          user_id,
          role,
          invitation_email,
          invitation_status
        )
      `
      )
      .eq("id", workspaceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new HTTPException(404, { message: "Workspace not found" });
      }
      throw new HTTPException(500, { message: "Failed to fetch workspace" });
    }

    const isMember = data?.workspace_members?.some(
      (member: { user_id: string; invitation_status: string }) =>
        member.user_id === userId && member.invitation_status === "accepted"
    );

    if (!data || !isMember) {
      throw new HTTPException(404, { message: "Workspace not found" });
    }

    return c.json({ data, success: true, error: null });
  });
}
