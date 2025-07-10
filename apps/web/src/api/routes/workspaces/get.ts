import { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";
import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Workspace, WorkspaceMember } from "../../lib/types";

export default async function getWorkspaces(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");

  if (!workspaceId) {
    return c.json(
      { data: null, success: false, error: "Workspace ID is required" },
      400
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const {
      data,
      error,
    }: PostgrestSingleResponse<
      Workspace & { workspace_members: WorkspaceMember[] | null }
    > = await supabase
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
      console.error(`Database error fetching workspace ${workspaceId}:`, error);

      if ((error as PostgrestError).code === "PGRST116") {
        return c.json(
          { data: null, success: false, error: "Workspace not found" },
          404
        );
      }
      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching workspace",
          details: error.message,
        },
        500
      );
    }

    const isMember = data?.workspace_members?.some(
      (member: WorkspaceMember) =>
        member.user_id === userId && member.invitation_status === "accepted"
    );

    if (!data || !isMember) {
      console.warn(
        `Access denied to workspace ${workspaceId} for user ${userId}`
      );
      return c.json(
        {
          data: null,
          success: false,
          error: "Workspace not found or access denied",
        },
        404
      );
    }

    return c.json({
      data: data,
      success: true,
      error: null,
    });
  } catch (err) {
    console.error(`Unexpected error fetching workspace ${workspaceId}:`, err);
    const errorDetails = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        data: null,
        success: false,
        error: "An unexpected error occurred",
        details: errorDetails,
      },
      500
    );
  }
}
