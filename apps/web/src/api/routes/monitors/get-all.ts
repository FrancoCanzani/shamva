import { Context } from "hono";
import { supabase } from "../../lib/supabase/client";
import { Incident, Log } from "../../lib/types";

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
      });
    }

    const incidentsByMonitorId = new Map<string, Partial<Incident>[]>();
    const logsByMonitorId = new Map<string, Partial<Log>[]>();

    if (monitors.length > 0) {
      const monitorIds = monitors.map((m) => m.id);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const fourteenDaysAgoISO = fourteenDaysAgo.toISOString();

      const [incidentsResult, logsResult] = await Promise.all([
        supabase
          .from("incidents")
          .select("id, monitor_id, created_at")
          .in("monitor_id", monitorIds)
          .gte("created_at", fourteenDaysAgoISO)
          .order("created_at", { ascending: false }),
        supabase
          .from("logs")
          .select("id, monitor_id, ok, latency, created_at")
          .in("monitor_id", monitorIds)
          .gte("created_at", fourteenDaysAgoISO)
          .order("created_at", { ascending: false }),
      ]);

      if (incidentsResult.error) {
        console.error(
          `Error fetching recent incidents:`,
          incidentsResult.error
        );
      } else if (incidentsResult.data) {
        for (const incident of incidentsResult.data) {
          if (!incidentsByMonitorId.has(incident.monitor_id)) {
            incidentsByMonitorId.set(incident.monitor_id, []);
          }
          incidentsByMonitorId.get(incident.monitor_id)!.push(incident);
        }
      }

      if (logsResult.error) {
        console.error(`Error fetching recent logs:`, logsResult.error);
      } else if (logsResult.data) {
        for (const log of logsResult.data) {
          if (!logsByMonitorId.has(log.monitor_id)) {
            logsByMonitorId.set(log.monitor_id, []);
          }
          logsByMonitorId.get(log.monitor_id)!.push(log);
        }
      }
    }

    const monitorsWithMetrics = monitors.map((monitor) => {
      const monitorIncidents = incidentsByMonitorId.get(monitor.id) || [];
      const monitorLogs = logsByMonitorId.get(monitor.id) || [];

      const lastIncident =
        monitorIncidents.length > 0 ? monitorIncidents[0] : null;

      const totalChecks = monitorLogs.length;
      const successfulChecks = monitorLogs.filter(
        (log) => log.ok === true
      ).length;
      const uptimePercentage =
        totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

      const latencies = monitorLogs
        .filter((log) => log.latency != null && log.latency > 0)
        .map((log) => log.latency!);
      const avgLatency =
        latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : 0;

      return {
        ...monitor,
        uptime_percentage: Math.round(uptimePercentage * 100) / 100,
        avg_latency: Math.round(avgLatency),
        last_incident: lastIncident
          ? {
              id: lastIncident.id,
              created_at: lastIncident.created_at,
            }
          : null,
      };
    });

    return c.json({
      data: monitorsWithMetrics,
      success: true,
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
