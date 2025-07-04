import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getLogs(c: Context): Promise<Response> {
  const userId = c.get("userId");
  const workspaceId = c.req.query("workspaceId");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401
    );
  }

  if (!workspaceId) {
    return c.json(
      { data: null, success: false, error: "Workspace ID is required" },
      400
    );
  }

  const supabase = createSupabaseClient(c.env);

  try {
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      if (membershipError?.code === "PGRST116") {
        return c.json(
          {
            data: null,
            success: false,
            error: "Workspace not found or user not a member",
          },
          404
        );
      }
      console.error(
        "Error checking workspace membership for logs:",
        membershipError
      );
      return c.json(
        {
          data: null,
          success: false,
          error: "Unauthorized to access logs in this workspace",
        },
        403
      );
    }

    const { data: monitors, error: monitorsError } = await supabase
      .from("monitors")
      .select("id")
      .eq("workspace_id", workspaceId);

    if (monitorsError) {
      console.error(
        "Error fetching monitor IDs for workspace logs:",
        monitorsError
      );
      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching monitors for logs",
        },
        500
      );
    }

    const monitorIds = monitors ? monitors.map((m) => m.id) : [];

    if (monitorIds.length === 0) {
      return c.json({ data: [], success: true, error: null }, 200);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const { data: logs, error: logError } = await supabase
      .from("logs")
      .select("*")
      .in("monitor_id", monitorIds)
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", {
        ascending: false,
      });

    if (logError) {
      console.error(
        `Error fetching logs for workspace ${workspaceId}:`,
        logError
      );
      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching logs",
          details: logError.message,
        },
        500
      );
    }

    return c.json({ data: logs || [], success: true, error: null });
  } catch (unexpectedError) {
    console.error(
      `Unexpected error getting logs for workspace ${workspaceId}:`,
      unexpectedError
    );
    const errorDetails =
      unexpectedError instanceof Error
        ? unexpectedError.message
        : String(unexpectedError);
    return c.json(
      {
        data: null,
        success: false,
        error: "An unexpected error occurred while fetching logs",
        details: errorDetails,
      },
      500
    );
  }
}
