import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function deleteWorkspaces(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401,
    );
  }

  if (!workspaceId) {
    return c.json(
      { data: null, success: false, error: "Workspace ID is required" },
      400,
    );
  }

  const supabase = createSupabaseClient(c.env);

  try {
    const { data: userMembership, error: userMembershipError } = await supabase
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
      console.warn(
        `Attempted workspace deletion by non-admin user ${userId} for workspace ${workspaceId}`,
      );
      return c.json(
        {
          success: false,
          error: "You do not have permission to delete this workspace.",
        },
        403,
      );
    }
  } catch (error) {
    console.error(
      `Database error checking workspace admin status for ${workspaceId}:`,
      error,
    );
    return c.json(
      {
        success: false,
        error: "Database error checking permissions.",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }

  try {
    const { data: monitors, error: monitorsError } = await supabase
      .from("monitors")
      .select("id")
      .eq("workspace_id", workspaceId);

    if (monitorsError) {
      console.error(
        `Error fetching monitors for workspace ${workspaceId} during deletion:`,
        monitorsError,
      );
      // continue with deletion even if fetching monitors fails, as we can still attempt to delete DB records
    }

    if (monitors && monitors.length > 0) {
      console.log(
        `Found ${monitors.length} monitors in workspace ${workspaceId} to delete.`,
      );

      for (const monitor of monitors) {
        const { data: checkers, error: checkersError } = await supabase
          .from("monitor_checkers")
          .select("id, region, do_id")
          .eq("monitor_id", monitor.id);

        if (checkersError) {
          console.error(
            `Error fetching monitor checkers for monitor ${monitor.id}:`,
            checkersError,
          );
          continue;
        }

        if (checkers && checkers.length > 0) {
          for (const checker of checkers) {
            if (!checker.do_id) continue;

            try {
              const doId = c.env.CHECKER_DURABLE_OBJECT.idFromString(
                checker.do_id,
              );
              const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId, {
                locationHint: checker.region,
              });

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);

              await doStub.fetch("http://do.com/cleanup", {
                method: "DELETE",
                signal: controller.signal,
              });

              clearTimeout(timeoutId);
              console.log(`Successfully cleaned up DO ${checker.do_id}`);
            } catch (doError) {
              console.error(
                `Error cleaning up DO ${checker.do_id} for monitor ${monitor.id}:`,
                doError,
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `Unexpected error during DO cleanup phase for workspace ${workspaceId}:`,
      error,
    );
  }

  try {
    // this will trigger cascade deletion of checkers and logs
    const { error: deleteMonitorsError } = await supabase
      .from("monitors")
      .delete()
      .eq("workspace_id", workspaceId);

    if (deleteMonitorsError) {
      console.error(
        `Database error deleting monitors for workspace ${workspaceId}:`,
        deleteMonitorsError,
      );
    }

    const { error: deleteMembersError } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId);

    if (deleteMembersError) {
      console.error(
        `Database error deleting members for workspace ${workspaceId}:`,
        deleteMembersError,
      );
    }

    const { error: deleteWorkspaceError } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId)
      .single();

    if (deleteWorkspaceError) {
      console.error(
        `Database error deleting workspace ${workspaceId}:`,
        deleteWorkspaceError,
      );

      if (deleteWorkspaceError.code === "PGRST116") {
        console.warn(
          `Workspace ${workspaceId} not found during deletion attempt.`,
        );
        return c.json(
          { success: false, error: "Workspace not found or already deleted." },
          404,
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to delete workspace.",
          details: deleteWorkspaceError.message,
        },
        500,
      );
    }

    console.log(`Successfully deleted workspace ${workspaceId}`);

    return c.json({
      success: true,
      message: "Workspace deleted successfully.",
    });
  } catch (unexpectedError) {
    console.error(
      `Unexpected error during workspace deletion ${workspaceId}:`,
      unexpectedError,
    );
    return c.json(
      {
        success: false,
        error: "An unexpected error occurred during workspace deletion.",
        details:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : String(unexpectedError),
      },
      500,
    );
  }
}
