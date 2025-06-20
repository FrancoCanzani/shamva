import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Log } from "../../lib/types";

export default async function getPublicStatusPage(c: Context) {
  const slug = c.req.param("slug");
  const password = c.req.query("password");

  if (!slug) {
    return c.json(
      { data: null, success: false, error: "Status page slug is required" },
      400
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: statusPage, error: statusPageError } = await supabase
      .from("status_pages")
      .select("*")
      .eq("slug", slug)
      .single();

    if (statusPageError) {
      if (statusPageError.code === "PGRST116") {
        return c.json(
          { data: null, success: false, error: "Status page not found" },
          404
        );
      }

      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching status page",
          details: statusPageError.message,
        },
        500
      );
    }

    if (!statusPage) {
      return c.json(
        { data: null, success: false, error: "Status page not found" },
        404
      );
    }

    if (!statusPage.is_public) {
      return c.json(
        { data: null, success: false, error: "Status page is not public" },
        403
      );
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
        .select("monitor_id, status_code, latency, created_at")
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
            (log: Partial<Log>) => typeof log.status_code === "number"
          );
          const successfulLogs = validLogs.filter(
            (log: Partial<Log>) =>
              log.status_code && log.status_code >= 200 && log.status_code < 300
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
              (log: Partial<Log>) => typeof log.status_code === "number"
            );
            const daySuccessfulLogs = dayValidLogs.filter(
              (log: Partial<Log>) =>
                log.status_code &&
                log.status_code >= 200 &&
                log.status_code < 300
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
  } catch (err) {
    console.error(`Unexpected error fetching public status page ${slug}:`, err);
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
