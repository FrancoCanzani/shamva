import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Log } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { ChevronDown, ChevronUp } from "lucide-react";
import MonitorTimelineChart from "./monitor-timeline-chart";

function getPercentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function getPrevPeriodLogs(logs: Partial<Log>[], days: number) {
  // For 1-day stats, we fetch 2 days of logs and split into two 24h periods
  if (days === 1) {
    const now = new Date();
    const periodMs = 24 * 60 * 60 * 1000;
    const start = now.getTime() - periodMs;
    const prevStart = start - periodMs;
    const prevEnd = start;
    return logs.filter((log) => {
      if (!log.created_at) return false;
      const t = new Date(log.created_at).getTime();
      return t >= prevStart && t < prevEnd;
    });
  }
  if (days === 7) {
    const now = new Date();
    const periodMs = days * 24 * 60 * 60 * 1000;
    const start = now.getTime() - periodMs;
    const prevStart = start - periodMs;
    const prevEnd = start;
    return logs.filter((log) => {
      if (!log.created_at) return false;
      const t = new Date(log.created_at).getTime();
      return t >= prevStart && t < prevEnd;
    });
  }
  return [];
}

export default function MonitorStats({ logs }: { logs: Partial<Log>[] }) {
  const { days } = Route.useSearch();

  const recentSuccessCount = logs.filter(
    (log) => typeof log.ok === "boolean" && log.ok === true
  ).length;

  const recentTotalCount = logs.length;
  const recentErrorCount = logs.filter(
    (log) => typeof log.ok === "boolean" && log.ok === false
  ).length;

  const recentDegradedCount =
    recentTotalCount - recentSuccessCount - recentErrorCount;
  const latencyArr = logs
    .filter((log) => typeof log.latency === "number" && log.latency > 0)
    .map((log) => log.latency as number);

  const p50 = getPercentile(latencyArr, 50);
  const p95 = getPercentile(latencyArr, 95);
  const p99 = getPercentile(latencyArr, 99);

  let prevErrorCount = null;
  let prevDegradedCount = null;
  let prevP50 = null;
  let prevP95 = null;
  let prevP99 = null;
  let prevUptime = null;

  if (days === 1 || days === 7) {
    const prevLogs = getPrevPeriodLogs(logs, days);
    prevErrorCount = prevLogs.filter(
      (log) => typeof log.ok === "boolean" && log.ok === false
    ).length;
    const prevTotal = prevLogs.length;
    const prevSuccess = prevLogs.filter(
      (log) => typeof log.ok === "boolean" && log.ok === true
    ).length;
    prevDegradedCount = prevTotal - prevSuccess - prevErrorCount;
    const prevLatencyArr = prevLogs
      .filter((log) => typeof log.latency === "number" && log.latency > 0)
      .map((log) => log.latency as number);
    prevP50 = getPercentile(prevLatencyArr, 50);
    prevP95 = getPercentile(prevLatencyArr, 95);
    prevP99 = getPercentile(prevLatencyArr, 99);
    prevUptime =
      prevTotal > 0 ? Math.round((prevSuccess / prevTotal) * 100) : 0;
  }

  function getProgressionText(
    current: number,
    prev: number | null,
    unit?: string
  ) {
    if (prev == null) return null;
    const diff = current - prev;
    if (diff === 0)
      return (
        <span className="text-muted-foreground ml-1 flex items-center gap-1 text-xs">
          <span>–</span> <span>same as last period</span>
        </span>
      );
    if (diff > 0)
      return (
        <span className="ml-1 flex items-center gap-1 text-xs text-red-800">
          <ChevronUp className="inline h-3 w-3" />+{Math.abs(diff)}
          {unit || ""}
          <span className="text-muted-foreground">vs last period</span>
        </span>
      );
    return (
      <span className="ml-1 flex items-center gap-1 text-xs text-green-800">
        <ChevronDown className="inline h-3 w-3" />
        {Math.abs(diff)}
        {unit || ""}
        <span className="text-muted-foreground">vs last period</span>
      </span>
    );
  }

  function getGradientClasses(
    current: number,
    prev: number | null,
    isLatency: boolean = false
  ) {
    if (prev == null) return "from-gray-200/20";
    const diff = current - prev;
    if (diff === 0) return "from-gray-200/20";

    // For latency, lower is better (opposite of error/degraded counts)
    if (isLatency) {
      if (diff > 0) return "from-red-300/20"; // Worse latency
      return "from-green-300/20"; // Better latency
    }

    // For error/degraded counts, lower is better
    if (diff > 0) return "from-red-300/20"; // More errors/degraded
    return "from-green-300/20"; // Fewer errors/degraded
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute bottom-0 -left-2 h-10 w-24 rounded-xl bg-gradient-to-tr from-green-300/20 via-transparent to-transparent"></div>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center font-mono font-medium text-green-800">
              {recentTotalCount > 0
                ? Math.round((recentSuccessCount / recentTotalCount) * 100) +
                  "%"
                : "0%"}
              {getProgressionText(
                recentTotalCount > 0
                  ? Math.round((recentSuccessCount / recentTotalCount) * 100)
                  : 0,
                prevUptime,
                "%"
              )}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div
              className={cn(
                "absolute bottom-0 -left-2 h-10 w-24 rounded-xl bg-gradient-to-tr via-transparent to-transparent",
                getGradientClasses(recentDegradedCount, prevDegradedCount)
              )}
            ></div>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            </CardHeader>
            <CardContent className="inline-flex items-center font-mono font-medium text-yellow-500">
              {recentDegradedCount.toLocaleString()}
              {getProgressionText(recentDegradedCount, prevDegradedCount)}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div
              className={cn(
                "absolute bottom-0 -left-2 h-10 w-24 rounded-xl bg-gradient-to-tr via-transparent to-transparent",
                getGradientClasses(recentErrorCount, prevErrorCount)
              )}
            ></div>
            <CardHeader>
              <CardTitle className="text-sm">Error</CardTitle>
            </CardHeader>
            <CardContent className="inline-flex items-center font-mono font-medium text-red-800">
              {recentErrorCount.toLocaleString()}
              {getProgressionText(recentErrorCount, prevErrorCount)}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div
              className={cn(
                "absolute bottom-0 -left-2 h-10 w-24 rounded-xl bg-gradient-to-tr via-transparent to-transparent",
                getGradientClasses(p50, prevP50, true)
              )}
            ></div>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Latency p50</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <span className="font-mono font-medium text-black dark:text-white">
                {p50}ms
              </span>
              {getProgressionText(p50, prevP50, "ms")}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div
              className={cn(
                "absolute bottom-0 -left-2 h-10 w-24 rounded-xl bg-gradient-to-tr via-transparent to-transparent",
                getGradientClasses(p95, prevP95, true)
              )}
            ></div>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Latency p95</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <span className="font-mono font-medium text-black dark:text-white">
                {p95}ms
              </span>
              {getProgressionText(p95, prevP95, "ms")}
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div
              className={cn(
                "absolute bottom-0 -left-2 h-10 w-24 rounded-xl bg-gradient-to-tr via-transparent to-transparent",
                getGradientClasses(p99, prevP99, true)
              )}
            ></div>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Latency p99</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <span className="font-mono font-medium text-black dark:text-white">
                {p99}ms
              </span>
              {getProgressionText(p99, prevP99, "ms")}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="w-full">
        <MonitorTimelineChart logs={logs} />
      </div>
    </div>
  );
}
