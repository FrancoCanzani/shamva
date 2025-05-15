import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getWorkspaces(c: Context) {
  const userId = c.get("userId");

  console.log(userId);

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401,
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: workspaces, error: workspacesError } = await supabase
      .from("workspaces")
      .select(
        `
        *,
        workspace_members!inner (
          id,
          role,
          invitation_status
        )
      `,
      )
      .eq("workspace_members.user_id", userId)
      .eq("workspace_members.invitation_status", "accepted");

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

    const workspacesWithCounts = await Promise.all(
      workspaces.map(async (workspace) => {
        const { count, error: countError } = await supabase
          .from("monitors")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspace.id);

        if (countError) {
          console.error(
            `Error counting monitors for workspace ${workspace.id}:`,
            countError,
          );
        }

        return {
          ...workspace,
          monitorCount: count || 0,
        };
      }),
    );

    return c.json({
      data: workspacesWithCounts,
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
