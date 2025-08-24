import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { UUIDParamSchema } from "./schemas";

const route = createRoute({
  method: "delete",
  path: "/workspaces/:id",
  request: { params: UUIDParamSchema },
  responses: {
    200: {
      description: "Deleted",
      content: {
        "application/json": { schema: z.object({ success: z.literal(true) }) },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerDeleteWorkspaces(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: workspaceId } = c.req.valid("param");

    try {
      const { data: userMembership, error: userMembershipError } =
        await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .single();

      if (
        userMembershipError ||
        !userMembership ||
        userMembership.role !== "admin"
      ) {
        throw new HTTPException(403, { message: "Insufficient permissions" });
      }
    } catch (error) {
      throw new HTTPException(500, { message: "Failed to check permissions" });
    }

    try {
      const { data: monitors, error: monitorsError } = await supabase
        .from("monitors")
        .select("id")
        .eq("workspace_id", workspaceId);

      if (monitorsError) {
        console.error(
          `Error fetching monitors for workspace ${workspaceId} during deletion:`,
          monitorsError
        );
        // continue with deletion even if fetching monitors fails, as we can still attempt to delete DB records
      }

      if (monitors && monitors.length > 0) {
        console.log(
          `Found ${monitors.length} monitors in workspace ${workspaceId} to delete.`
        );
      }
    } catch (error) {
      console.error(
        `Unexpected error during DO cleanup phase for workspace ${workspaceId}:`,
        error
      );
    }

    try {
      const { error: deleteMonitorsError } = await supabase
        .from("monitors")
        .delete()
        .eq("workspace_id", workspaceId);

      if (deleteMonitorsError) {
        console.error(
          `Database error deleting monitors for workspace ${workspaceId}:`,
          deleteMonitorsError
        );
      }

      const { error: deleteMembersError } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId);

      if (deleteMembersError) {
        console.error(
          `Database error deleting members for workspace ${workspaceId}:`,
          deleteMembersError
        );
      }

      const { error: deleteWorkspaceError } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", workspaceId)
        .single();

      if (deleteWorkspaceError) {
        if (deleteWorkspaceError.code === "PGRST116") {
          throw new HTTPException(404, { message: "Workspace not found" });
        }
        throw new HTTPException(500, { message: "Failed to delete workspace" });
      }

      console.log(`Successfully deleted workspace ${workspaceId}`);

      return c.json({ success: true });
    } catch (unexpectedError) {
      console.error(
        `Unexpected error during workspace deletion ${workspaceId}:`,
        unexpectedError
      );
      throw new HTTPException(500, { message: "Failed to delete workspace" });
    }
  });
}
