import { Context } from "hono";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";
import { Incident, Log } from "../../lib/types";

const querySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 7;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 28) {
        return 14;
      }
      return parsed;
    }),
  region: z
    .enum(["wnam", "enam", "sam", "weur", "eeur", "apac", "oc", "afr", "me"])
    .optional(),
});

export default async function getMonitors(c: Context) {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");
  const daysParam = c.req.query("days");
  const regionParam = c.req.query("region");

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

  const { days, region } = querySchema.parse({
    days: daysParam,
    region: regionParam,
  });

  try {
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

    const date = new Date();
    // fetch double the days to enable comparison with previous period
    if (days === 1) {
      date.setDate(date.getDate() - 2);
    } else if (days === 7) {
      date.setDate(date.getDate() - 14);
    } else if (days === 14) {
      date.setDate(date.getDate() - 28);
    } else {
      date.setDate(date.getDate() - days);
    }

    const daysAgo = date.toISOString();

    let logsQuery = supabase
      .from("logs")
      .select("id, created_at, ok, latency, region, status_code")
      .eq("monitor_id", monitorId)
      .gte("created_at", daysAgo)
      .order("created_at", { ascending: false });

    if (region) {
      logsQuery = logsQuery.eq("region", region);
    }

    const [membershipResult, logsResult, incidentsResult] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", monitor.workspace_id)
        .eq("user_id", userId)
        .eq("invitation_status", "accepted")
        .single(),
      logsQuery,
      supabase
        .from("incidents")
        .select("*")
        .eq("monitor_id", monitorId)
        .or(`created_at.gte.${daysAgo},resolved_at.is.null`)
        .order("created_at", { ascending: false }),
    ]);

    const { data: membership, error: membershipError } = membershipResult;
    const { data: recentLogs, error: logError } = logsResult;
    const { data: incidents, error: incidentError } = incidentsResult;

    if (membershipError || !membership) {
      return c.json(
        { data: null, success: false, error: "Monitor not found" },
        404
      );
    }

    if (logError) {
      console.error(
        `Error fetching recent logs for monitor ${monitorId}:`,
        logError
      );
      monitor.recent_logs = [];
    } else {
      monitor.recent_logs = (recentLogs || []) as Log[];
    }

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
