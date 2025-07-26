import { Context } from "hono";
import { z } from "zod";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Incident, Log } from "../../lib/types";

const querySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 14;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 14) {
        return 14;
      }
      return parsed;
    }),
});

export default async function getMonitors(c: Context) {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");
  const daysParam = c.req.query("days");

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

  const { days } = querySchema.parse({ days: daysParam });

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

    const date = new Date();
    if (days === 1) {
      date.setDate(date.getDate() - (days + 1));
    } else {
      date.setDate(date.getDate() - days);
    }

    const daysAgo = date.toISOString();

    const { data: recentLogs, error: logError } = await supabase
      .from("logs")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("created_at", daysAgo)
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
      .or(`created_at.gte.${daysAgo},resolved_at.is.null`)
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
