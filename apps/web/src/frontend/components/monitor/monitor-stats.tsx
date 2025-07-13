import { Log } from "@/frontend/lib/types";
import { calculatePercentile, cn, getLatencyColor } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { UptimeStackedBar } from "./uptime-stacked-bar";

export default function MonitorStats({ logs }: { logs: Partial<Log>[] }) {
  const { days } = Route.useSearch();

  const recentSuccessCount = logs.filter(
    (log) => typeof log.ok === "boolean" && log.ok === true
  ).length;

  const recentTotalCount = logs.length;
  const recentSuccessRate =
    recentTotalCount > 0 ? (recentSuccessCount / recentTotalCount) * 100 : 0;

  const recentErrorCount = logs.filter(
    (log) => typeof log.ok === "boolean" && log.ok === false
  ).length;
  const recentDegradedCount =
    recentTotalCount - recentSuccessCount - recentErrorCount;

  const allLatencies = logs.map((log) => log.latency as number);

  const p50 = calculatePercentile(allLatencies, 50);
  const p75 = calculatePercentile(allLatencies, 75);
  const p95 = calculatePercentile(allLatencies, 95);
  const p99 = calculatePercentile(allLatencies, 99);

  const formatRate = (rate: number) => Math.round(rate) + "%";
  const formatLatency = (ms: number) => Math.round(ms) + "ms";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Uptime
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">Last {days}d</div>
              <div
                className={cn(
                  "font-mono font-medium",
                  recentSuccessRate >= 98
                    ? "text-green-700"
                    : recentSuccessRate >= 90
                      ? "text-yellow-500"
                      : "text-red-700"
                )}
              >
                {formatRate(recentSuccessRate)}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Degraded
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">Last {days}d</div>
              <div className="font-mono font-medium text-yellow-500">
                {recentDegradedCount.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-muted-foreground text-sm">of period</div>
              <div className="font-mono text-sm font-medium text-yellow-500">
                {recentTotalCount > 0
                  ? `${Math.round((recentDegradedCount / recentTotalCount) * 100)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Error
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">Last {days}d</div>
              <div className="font-mono font-medium text-red-700">
                {recentErrorCount.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-muted-foreground text-sm">of period</div>
              <div className="font-mono text-sm font-medium text-red-700">
                {recentTotalCount > 0
                  ? `${Math.round((recentErrorCount / recentTotalCount) * 100)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <UptimeStackedBar logs={logs} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            P50 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">Median</div>
              <div
                className={cn("font-mono font-medium", getLatencyColor(p50))}
              >
                {formatLatency(p50)}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            P75 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">
                75th percentile
              </div>
              <div
                className={cn("font-mono font-medium", getLatencyColor(p75))}
              >
                {formatLatency(p75)}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            P95 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">
                95th percentile
              </div>
              <div
                className={cn("font-mono font-medium", getLatencyColor(p95))}
              >
                {formatLatency(p95)}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            P99 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">
                99th percentile
              </div>
              <div
                className={cn("font-mono font-medium", getLatencyColor(p99))}
              >
                {formatLatency(p99)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
