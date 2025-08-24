import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { WorkspaceWithMembersSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/workspaces",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(WorkspaceWithMembersSchema),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetAllWorkspaces(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");

    const { data: memberWorkspaces, error: memberWorkspacesError } =
      await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .eq("invitation_status", "accepted")
        .order("created_at", { ascending: false });

    if (memberWorkspacesError) {
      throw new HTTPException(500, { message: "Failed to fetch memberships" });
    }

    const workspaceIds = (memberWorkspaces ?? []).map((m) => m.workspace_id);
    if (workspaceIds.length === 0) {
      return c.json({ data: [], success: true, error: null });
    }

    const { data: workspaces, error: workspacesError } = await supabase
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
      .in("id", workspaceIds)
      .order("created_at", { ascending: false });

    if (workspacesError) {
      throw new HTTPException(500, { message: "Failed to fetch workspaces" });
    }

    return c.json({ data: workspaces ?? [], success: true, error: null });
  });
}
