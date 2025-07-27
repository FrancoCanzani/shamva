import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Log } from "@/frontend/types/types";
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
  const p99 = getPercentile(latencyArr, 99);

  let prevErrorCount = null;
  let prevDegradedCount = null;
  let prevP50 = null;
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
    prevP99 = getPercentile(prevLatencyArr, 99);
    prevUptime =
      prevTotal > 0 ? Math.round((prevSuccess / prevTotal) * 100) : 0;
  }

  const currentUptime =
    recentTotalCount > 0
      ? Math.round((recentSuccessCount / recentTotalCount) * 100)
      : 0;
  const uptimeDiff = prevUptime !== null ? currentUptime - prevUptime : null;
  const errorDiff =
    prevErrorCount !== null ? recentErrorCount - prevErrorCount : null;
  const degradedDiff =
    prevDegradedCount !== null ? recentDegradedCount - prevDegradedCount : null;
  const p50Diff = prevP50 !== null ? p50 - prevP50 : null;
  const p99Diff = prevP99 !== null ? p99 - prevP99 : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            </CardHeader>
            <CardContent className="inline-flex items-center gap-1">
              <span className="font-mono font-medium text-green-800">
                {currentUptime}%
              </span>
              {uptimeDiff === null ? null : uptimeDiff === 0 ? (
                <span className="text-muted-foreground text-xs">
                  – Same as last period
                </span>
              ) : uptimeDiff > 0 ? (
                <div className="inline-flex items-center gap-1 text-xs text-green-800">
                  <ChevronUp className="inline h-3 w-3" />+
                  {Math.abs(uptimeDiff)}%
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs text-red-800">
                  <ChevronDown className="h-3 w-3" />
                  {Math.abs(uptimeDiff)}%
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            </CardHeader>
            <CardContent className="inline-flex items-center gap-1">
              <span className="font-mono font-medium text-yellow-500">
                {recentDegradedCount.toLocaleString()}
              </span>
              {degradedDiff === null ? null : degradedDiff === 0 ? (
                <span className="text-muted-foreground text-xs">
                  - Same as last period
                </span>
              ) : degradedDiff > 0 ? (
                <div className="inline-flex items-center gap-1 text-xs text-red-800">
                  <ChevronUp className="h-3 w-3" />+{Math.abs(degradedDiff)}
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-800">
                  <ChevronDown className="h-3 w-3" />
                  {Math.abs(degradedDiff)}
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Error</CardTitle>
            </CardHeader>
            <CardContent className="inline-flex items-center gap-1">
              <span className="font-mono font-medium text-red-800">
                {recentErrorCount.toLocaleString()}
              </span>
              {errorDiff === null ? null : errorDiff === 0 ? (
                <span className="text-muted-foreground text-xs">
                  - Same as last period
                </span>
              ) : errorDiff > 0 ? (
                <div className="inline-flex items-center gap-1 text-xs text-red-800">
                  <ChevronUp className="inline h-3 w-3" />+{Math.abs(errorDiff)}
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              ) : (
                <span className="ml-1 flex items-center gap-1 text-xs text-green-800">
                  <ChevronDown className="inline h-3 w-3" />
                  {Math.abs(errorDiff)}
                  <span className="text-muted-foreground">vs last period</span>
                </span>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Latency p50</CardTitle>
            </CardHeader>
            <CardContent className="inline-flex items-center gap-1">
              <span className="font-mono font-medium">{p50}ms</span>
              {p50Diff === null ? null : p50Diff === 0 ? (
                <span className="text-muted-foreground text-xs">
                  - Same as last period
                </span>
              ) : p50Diff > 0 ? (
                <div className="inline-flex items-center gap-1 text-xs text-red-800">
                  <ChevronUp className="inline h-3 w-3" />+{Math.abs(p50Diff)}ms{" "}
                  {prevP50 && prevP50 > 0
                    ? `(+${Math.round((Math.abs(p50Diff) / prevP50) * 100)}%)`
                    : ""}
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs text-green-800">
                  <ChevronDown className="h-3 w-3" />
                  {Math.abs(p50Diff)}ms{" "}
                  {prevP50 && prevP50 > 0
                    ? `(-${Math.round((Math.abs(p50Diff) / prevP50) * 100)}%)`
                    : ""}
                  <span className="text-muted-foreground truncate">
                    vs last period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Latency p99</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <span className="font-mono font-medium text-black dark:text-white">
                {p99}ms
              </span>
              {p99Diff === null ? null : p99Diff === 0 ? (
                <span className="text-muted-foreground ml-1 flex items-center gap-1 text-xs">
                  <span>–</span> <span>same as last period</span>
                </span>
              ) : p99Diff > 0 ? (
                <span className="ml-1 flex items-center gap-1 text-xs text-red-800">
                  <ChevronUp className="inline h-3 w-3" />+{Math.abs(p99Diff)}ms{" "}
                  {prevP99 && prevP99 > 0
                    ? `(+${Math.round((Math.abs(p99Diff) / prevP99) * 100)}%)`
                    : ""}
                  <span className="text-muted-foreground">vs last period</span>
                </span>
              ) : (
                <span className="ml-1 flex items-center gap-1 text-xs text-green-800">
                  <ChevronDown className="inline h-3 w-3" />
                  {Math.abs(p99Diff)}ms{" "}
                  {prevP99 && prevP99 > 0
                    ? `(-${Math.round((Math.abs(p99Diff) / prevP99) * 100)}%)`
                    : ""}
                  <span className="text-muted-foreground truncate">
                    vs last period
                  </span>
                </span>
              )}
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
