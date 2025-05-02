import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Log } from "../../lib/types";

export default async function getMonitor(c: Context) {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401,
    );
  }

  if (!monitorId) {
    return c.json(
      { data: null, success: false, error: "Monitor ID is required" },
      400,
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: monitor, error: monitorError } = await supabase
      .from("monitors")
      .select("*")
      .eq("id", monitorId)
      .eq("user_id", userId)
      .single();

    if (monitorError) {
      if (monitorError.code === "PGRST116") {
        return c.json(
          { data: null, success: false, error: "Monitor not found" },
          404,
        );
      }

      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching monitor",
          details: monitorError.message,
        },
        500,
      );
    }

    if (!monitor) {
      return c.json(
        { data: null, success: false, error: "Monitor not found" },
        404,
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const { data: recentLogs, error: logError } = await supabase
      .from("logs")
      .select(
        "id, monitor_id, created_at, status_code, latency, error, region, method, headers, body_content, url, do_id, user_id",
      )
      .eq("monitor_id", monitorId)
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: false })
      .limit(50);

    if (logError) {
      console.error(
        `Error fetching recent logs for monitor ${monitorId}:`,
        logError,
      );

      monitor.recent_logs = [];
    } else {
      monitor.recent_logs = (recentLogs || []) as Log[];
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
      500,
    );
  }
}
