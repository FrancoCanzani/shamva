import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Log } from "../../lib/types";

export default async function getAllMonitors(c: Context) {
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
      { data: null, success: false, error: "Workspace Id is missing" },
      400
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      return c.json({
        data: [],
        success: true,
        error: null,
      });
    }

    const { data: monitors, error: monitorError } = await supabase
      .from("monitors")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (monitorError) {
      console.error("Error fetching monitors from DB:", monitorError);
      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching monitors",
          details: monitorError.message,
        },
        500
      );
    }

    if (!monitors || monitors.length === 0) {
      return c.json({
        data: [],
        success: true,
        error: null,
      });
    }

    const monitorIds = monitors.map((m) => m.id);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const { data: recentLogs, error: logError } = await supabase
      .from("logs")
      .select("*")
      .in("monitor_id", monitorIds)
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: false });

    if (logError) {
      console.error(`Error fetching recent logs:`, logError);
    }

    const logsByMonitorId = new Map<string, Partial<Log>[]>();
    if (recentLogs) {
      for (const log of recentLogs) {
        if (!logsByMonitorId.has(log.monitor_id)) {
          logsByMonitorId.set(log.monitor_id, []);
        }
        logsByMonitorId.get(log.monitor_id)!.push(log);
      }
    }

    const monitorsWithLogs = monitors.map((monitor) => ({
      ...monitor,
      recent_logs: logsByMonitorId.get(monitor.id) || [],
    }));

    return c.json({
      data: monitorsWithLogs,
      success: true,
      error: null,
    });
  } catch (err) {
    console.error("Unexpected error fetching monitors:", err);
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
