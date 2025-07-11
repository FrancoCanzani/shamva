import { Log } from "@/frontend/lib/types";
import { calculatePercentile, cn, getLatencyColor } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";

export default function MonitorStats({ logs }: { logs: Partial<Log>[] }) {
  const { days } = Route.useSearch();

  const recentSuccessCount = logs.filter(
    (log) => typeof log.ok === "boolean" && log.ok === true
  ).length;

  const recentTotalCount = logs.length;
  const recentSuccessRate =
    recentTotalCount > 0 ? (recentSuccessCount / recentTotalCount) * 100 : 0;

  const allLatencies = logs.map((log) => log.latency as number);

  const p50 = calculatePercentile(allLatencies, 50);
  const p75 = calculatePercentile(allLatencies, 75);
  const p95 = calculatePercentile(allLatencies, 95);
  const p99 = calculatePercentile(allLatencies, 99);

  const formatRate = (rate: number) => Math.round(rate) + "%";
  const formatLatency = (ms: number) => Math.round(ms) + "ms";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Statistics</h2>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Success Rate
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

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Total Checks
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">Last {days}d</div>
              <div className="font-mono font-medium">
                {recentTotalCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Successes
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">Last {days}d</div>
              <div className="font-mono font-medium text-green-700">
                {recentSuccessCount.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-muted-foreground text-sm">of period</div>
              <div className="font-mono text-sm font-medium text-green-700">
                {recentTotalCount > 0
                  ? `${Math.round((recentSuccessCount / recentTotalCount) * 100)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Failures
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground text-xs">Last {days}d</div>
              <div className="font-mono font-medium text-red-700">
                {(recentTotalCount - recentSuccessCount).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-muted-foreground text-sm">of period</div>
              <div className="font-mono text-sm font-medium text-red-700">
                {recentTotalCount > 0
                  ? `${Math.round(((recentTotalCount - recentSuccessCount) / recentTotalCount) * 100)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
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

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
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

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
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

        <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded-md border p-2 shadow-xs">
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
