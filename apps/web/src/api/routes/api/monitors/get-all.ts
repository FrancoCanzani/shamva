import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables, Log } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { MonitorSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/monitors",
  request: {
    query: z.object({
      workspaceId: z
        .uuid()
        .openapi({ example: "a81bc81b-dead-4e5d-abff-90865d1e13b1" }),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(MonitorSchema),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetAllMonitors(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("query");

    try {
      const { data: membership, error: membershipError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .eq("invitation_status", "accepted")
        .single();

      if (membershipError || !membership) {
        throw new HTTPException(403, {
          message: "Unauthorized to list monitors in this workspace",
        });
      }

      const { data: monitors, error: monitorError } = await supabase
        .from("monitors")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (monitorError) {
        throw new HTTPException(500, {
          message: "Database error fetching monitors",
        });
      }

      if (!monitors || monitors.length === 0) {
        return c.json({ data: [], success: true, error: null });
      }

      const incidentsByMonitorId = new Map<
        string,
        Partial<{ id: string; monitor_id: string; created_at: string }>[]
      >();
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

      return c.json({ data: monitorsWithMetrics, success: true, error: null });
    } catch {
      throw new HTTPException(500, { message: "Failed to list monitors" });
    }
  });
}
