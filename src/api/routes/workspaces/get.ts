import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getWorkspaces(c: Context) {
  const userId = c.get("userId");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401,
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: memberWorkspaces, error: memberWorkspacesError } =
      await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .eq("invitation_status", "accepted")
        .order("created_at", { ascending: false });

    if (memberWorkspacesError) {
      console.error(
        "Error fetching user's workspace memberships:",
        memberWorkspacesError,
      );
      return c.json(
        {
          success: false,
          error: "Database error fetching workspace memberships",
          details: memberWorkspacesError.message,
        },
        500,
      );
    }

    const workspaceIds = memberWorkspaces.map((m) => m.workspace_id);

    if (workspaceIds.length === 0) {
      return c.json({
        data: [],
        success: true,
      });
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
      `,
      )
      .in("id", workspaceIds)
      .order("created_at", { ascending: false });

    if (workspacesError) {
      console.error("Error fetching workspaces:", workspacesError);
      return c.json(
        {
          success: false,
          error: "Database error fetching workspaces",
          details: workspacesError.message,
        },
        500,
      );
    }

    return c.json({
      data: workspaces,
      success: true,
    });
  } catch (error) {
    console.error("Unexpected error fetching workspaces:", error);
    return c.json(
      {
        success: false,
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
}
