import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Log, Incident } from "../../lib/types";

export default async function getMonitors(c: Context) {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401
    );
  }

  if (!monitorId) {
    return c.json(
      { data: null, success: false, error: "Monitor ID is required" },
      400
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: monitor, error: monitorError } = await supabase
      .from("monitors")
      .select("*")
      .eq("id", monitorId)
      .single();

    if (monitorError) {
      if (monitorError.code === "PGRST116") {
        return c.json(
          { data: null, success: false, error: "Monitor not found" },
          404
        );
      }

      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching monitor",
          details: monitorError.message,
        },
        500
      );
    }

    if (!monitor) {
      return c.json(
        { data: null, success: false, error: "Monitor not found" },
        404
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", monitor.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      return c.json(
        { data: null, success: false, error: "Monitor not found" },
        404
      );
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const { data: recentLogs, error: logError } = await supabase
      .from("logs")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("created_at", thirtyDaysAgoISO)
      .order("created_at", { ascending: false });

    if (logError) {
      console.error(
        `Error fetching recent logs for monitor ${monitorId}:`,
        logError
      );
      monitor.recent_logs = [];
    } else {
      monitor.recent_logs = (recentLogs || []) as Log[];
    }

    const { data: incidents, error: incidentError } = await supabase
      .from("incidents")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("created_at", thirtyDaysAgoISO)
      .order("created_at", { ascending: false });

    if (incidentError) {
      console.error(
        `Error fetching incidents for monitor ${monitorId}:`,
        incidentError
      );
      monitor.incidents = [];
    } else {
      monitor.incidents = (incidents || []) as Incident[];
    }

    return c.json({
      data: monitor,
      success: true,
      error: null,
    });
  } catch (err) {
    console.error(`Unexpected error fetching monitor ${monitorId}:`, err);
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
