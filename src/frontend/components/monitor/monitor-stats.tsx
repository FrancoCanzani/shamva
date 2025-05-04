import { Monitor } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { subDays } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

interface MonitorStatsProps {
  monitor: Monitor;
  recentDays?: number;
}

export default function MonitorStats({
  monitor,
  recentDays = 7,
}: MonitorStatsProps) {
  const totalChecks = monitor.success_count + monitor.failure_count;
  const allTimeSuccessRate =
    totalChecks > 0 ? (monitor.success_count / totalChecks) * 100 : 0;

  const recentDate = subDays(new Date(), recentDays);
  const recentLogs = monitor.recent_logs.filter((log) => {
    if (!log.created_at) return false;
    const logDate = new Date(log.created_at);
    return logDate >= recentDate;
  });

  const recentSuccessCount = recentLogs.filter(
    (log) =>
      typeof log.status_code === "number" &&
      log.status_code >= 200 &&
      log.status_code < 300,
  ).length;

  const recentTotalCount = recentLogs.length;
  const recentSuccessRate =
    recentTotalCount > 0 ? (recentSuccessCount / recentTotalCount) * 100 : 0;

  const successRateDiff = recentSuccessRate - allTimeSuccessRate;

  const formatRate = (rate: number) => Math.round(rate) + "%";
  const formatDiff = (diff: number) => {
    const rounded = Math.abs(Math.round(diff * 10) / 10);
    return diff > 0 ? `+${rounded}%` : diff < 0 ? `-${rounded}%` : "±0%";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="border border-dashed p-2 hover:bg-slate-50">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Success Rate
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              Last {recentDays}d
            </div>
            <div
              className={cn(
                "font-mono font-medium",
                recentSuccessRate >= 98
                  ? "text-green-700"
                  : recentSuccessRate >= 90
                    ? "text-yellow-500"
                    : "text-red-500",
              )}
            >
              {formatRate(recentSuccessRate)}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-xs font-mono text-muted-foreground">
              vs all time
            </div>
            <div
              className={cn(
                "flex items-center text-sm font-medium font-mono",
                successRateDiff > 0
                  ? "text-green-700"
                  : successRateDiff < 0
                    ? "text-red-500"
                    : "text-gray-500",
              )}
            >
              {successRateDiff > 0.5 ? (
                <ArrowUpIcon className="mr-1 size-3" />
              ) : successRateDiff < -0.5 ? (
                <ArrowDownIcon className="mr-1 size-3" />
              ) : (
                <MinusIcon className="mr-1 size-3" />
              )}
              {formatDiff(successRateDiff)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-2">
          <div className="h-1 flex-1 bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                recentSuccessRate >= 98
                  ? "bg-green-700"
                  : recentSuccessRate >= 90
                    ? "bg-yellow-500"
                    : "bg-red-500",
              )}
              style={{ width: `${Math.max(recentSuccessRate, 3)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRate(recentSuccessRate)}
          </span>
        </div>
      </div>

      <div className="border border-dashed p-2 hover:bg-slate-50">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Total Checks
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              Last {recentDays}d
            </div>
            <div className="font-mono font-medium">
              {recentTotalCount.toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-xs text-muted-foreground">of all time</div>
            <div className="text-sm font-mono font-medium">
              {totalChecks > 0
                ? `${Math.round((recentTotalCount / totalChecks) * 100)}%`
                : "0%"}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          {totalChecks.toLocaleString()} total lifetime checks
        </div>
      </div>

      <div className="border border-dashed p-2 hover:bg-slate-50">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Successes
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              Last {recentDays}d
            </div>
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

        <div className="text-xs text-gray-500 mt-2">
          {monitor.success_count.toLocaleString()} total successes (
          {formatRate(allTimeSuccessRate)})
        </div>
      </div>

      <div className="border border-dashed p-2 hover:bg-slate-50">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Failures
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">
              Last {recentDays}d
            </div>
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

        <div className="text-xs text-muted-foreground mt-2">
          {monitor.failure_count.toLocaleString()} total failures (
          {100 - Math.round(allTimeSuccessRate)}%)
        </div>
      </div>
    </div>
  );
}
