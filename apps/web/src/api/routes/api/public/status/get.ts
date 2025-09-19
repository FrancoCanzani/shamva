import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { EnvBindings } from "../../../../../../bindings";
import { supabase } from "../../../../lib/supabase/client";
import type { ApiVariables, Log } from "../../../../lib/types";
import { openApiErrorResponses } from "../../../../lib/utils";

const route = createRoute({
  method: "get",
  path: "/public/status/:slug",
  request: {
    params: z.object({
      slug: z
        .string()
        .min(1)
        .openapi({ param: { name: "slug", in: "path" } }),
    }),
    query: z.object({
      password: z
        .string()
        .optional()
        .openapi({
          param: { name: "password", in: "query" },
          example: "secure123",
        }),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({ requiresPassword: z.boolean() }),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetPublicStatusPage(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const { slug } = c.req.valid("param");
    const { password } = c.req.valid("query");

    try {
      const { data: statusPage, error: statusPageError } = await supabase
        .from("status_pages")
        .select("*")
        .eq("slug", slug)
        .single();

      if (statusPageError || !statusPage) {
        if (statusPageError?.code === "PGRST116") {
          throw new HTTPException(404, { message: "Status page not found" });
        }
        throw new HTTPException(500, {
          message: "Failed to fetch status page",
        });
      }

      if (!statusPage.is_public) {
        throw new HTTPException(403, { message: "Status page is not public" });
      }

      if (statusPage.password) {
        if (!password || password !== statusPage.password) {
          return c.json(
            {
              data: { requiresPassword: true },
              success: false,
              error: "Password required",
            },
            401
          );
        }
      }

      const { data: monitors, error: monitorsError } = await supabase
        .from("monitors")
        .select("*")
        .in("id", statusPage.monitors);

      if (monitorsError) {
        return c.json(
          {
            data: null,
            success: false,
            error: "Error fetching monitor data",
            details: monitorsError.message,
          },
          500
        );
      }

      let monitorsWithStats = monitors || [];

      if (statusPage.show_values && monitors && monitors.length > 0) {
        const monitorIds = monitors.map((m) => m.id);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        const { data: recentLogs, error: logError } = await supabase
          .from("logs")
          .select("monitor_id, status_code, latency, created_at, ok")
          .in("monitor_id", monitorIds)
          .gte("created_at", thirtyDaysAgoISO)
          .order("created_at", { ascending: false });

        if (!logError && recentLogs) {
          const logsByMonitorId = new Map();
          for (const log of recentLogs) {
            if (!logsByMonitorId.has(log.monitor_id)) {
              logsByMonitorId.set(log.monitor_id, []);
            }
            logsByMonitorId.get(log.monitor_id).push(log);
          }

          monitorsWithStats = monitors.map((monitor) => {
            const logs = logsByMonitorId.get(monitor.id) || [];

            const validLogs = logs.filter(
              (log: Partial<Log>) => typeof log.ok === "boolean"
            );
            const successfulLogs = validLogs.filter(
              (log: Partial<Log>) => log.ok === true
            );

            const uptimePercentage =
              validLogs.length > 0
                ? (successfulLogs.length / validLogs.length) * 100
                : 100;

            const latencies = logs.map((log: Partial<Log>) => log.latency);

            const avgResponseTime =
              latencies.length > 0
                ? latencies.reduce((sum: number, lat: number) => sum + lat, 0) /
                  latencies.length
                : 0;

            const dailyStats = [];
            for (let i = 29; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split("T")[0];

              const dayLogs = logs.filter((log: Partial<Log>) => {
                const logDate = new Date(log.created_at!)
                  .toISOString()
                  .split("T")[0];
                return logDate === dateStr;
              });

              const dayValidLogs = dayLogs.filter(
                (log: Partial<Log>) => typeof log.ok === "boolean"
              );
              const daySuccessfulLogs = dayValidLogs.filter(
                (log: Partial<Log>) => log.ok === true
              );

              const dayUptimePercentage =
                dayValidLogs.length > 0
                  ? (daySuccessfulLogs.length / dayValidLogs.length) * 100
                  : null;

              dailyStats.push({
                date: dateStr,
                total_requests: dayValidLogs.length,
                successful_requests: daySuccessfulLogs.length,
                failed_requests: dayValidLogs.length - daySuccessfulLogs.length,
                uptime_percentage: dayUptimePercentage,
              });
            }

            return {
              ...monitor,
              uptime_percentage: Math.round(uptimePercentage * 100) / 100,
              avg_response_time: Math.round(avgResponseTime),
              total_checks: validLogs.length,
              successful_checks: successfulLogs.length,
              daily_stats: dailyStats,
            };
          });
        }
      }

      return c.json({
        data: {
          ...statusPage,
          monitors: monitorsWithStats,
          requiresPassword: false,
        },
        success: true,
        error: null,
      });
    } catch {
      throw new HTTPException(500, {
        message: "Failed to fetch public status",
      });
    }
  });
}
