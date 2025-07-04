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
        <h2 className="text-sm font-medium">{`Statistics`} </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Success Rate
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Last {days}d</div>
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

        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Total Checks
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Last {days}d</div>
              <div className="font-mono font-medium">
                {recentTotalCount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Successes
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Last {days}d</div>
              <div className="font-mono font-medium text-green-700">
                {recentSuccessCount.toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-sm text-muted-foreground">of period</div>
              <div className="text-sm font-medium font-mono text-green-700">
                {recentTotalCount > 0
                  ? `${Math.round((recentSuccessCount / recentTotalCount) * 100)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>

        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Failures
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Last {days}d</div>
              <div className="font-mono font-medium text-red-700">
                {(recentTotalCount - recentSuccessCount).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-sm text-muted-foreground">of period</div>
              <div className="text-sm font-medium font-mono text-red-700">
                {recentTotalCount > 0
                  ? `${Math.round(((recentTotalCount - recentSuccessCount) / recentTotalCount) * 100)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            P50 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Median</div>
              <div
                className={cn("font-mono font-medium", getLatencyColor(p50))}
              >
                {formatLatency(p50)}
              </div>
            </div>
          </div>
        </div>

        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            P75 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">
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

        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            P95 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">
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

        <div className="border shadow-xs rounded-xs p-2 hover:bg-carbon-50 hover:dark:bg-carbon-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            P99 Latency
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">
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
