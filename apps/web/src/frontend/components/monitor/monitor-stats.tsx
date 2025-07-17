import { Log } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import MonitorTimelineChart from "./monitor-timeline-chart";

function getPercentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function getPrevPeriodLogs(logs: Partial<Log>[], days: number) {
  if (days !== 7) return [];
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
  if (days === 7) {
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
  }

  function renderProgression(current: number, prev: number | null) {
    if (prev == null) return null;
    const diff = current - prev;
    if (diff === 0)
      return <span className="text-muted-foreground ml-1 text-xs">(=)</span>;
    if (diff > 0)
      return <span className="ml-1 text-xs text-red-700">(+{diff})</span>;
    return <span className="ml-1 text-xs text-green-700">({diff})</span>;
  }

  function renderLatencyProgression(current: number, prev: number | null) {
    if (prev == null) return null;
    const diff = current - prev;
    if (diff === 0)
      return <span className="text-muted-foreground ml-1 text-xs">(=)</span>;
    if (diff > 0)
      return <span className="ml-1 text-xs text-red-700">(+{diff}ms)</span>;
    return <span className="ml-1 text-xs text-green-700">({diff}ms)</span>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="col-span-2 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-3 shadow-xs">
            <h3 className="mb-2 text-sm font-medium">Uptime</h3>
            <div className="flex items-center justify-between">
              <div className={cn("text-muted-foreground font-mono")}>
                {recentTotalCount > 0
                  ? Math.round((recentSuccessCount / recentTotalCount) * 100) +
                    "%"
                  : "0%"}
              </div>
            </div>
          </div>
          <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-3 shadow-xs">
            <h3 className="mb-2 text-sm font-medium">Degraded</h3>
            <div className="flex items-center justify-between">
              <div className="font-mono text-yellow-500">
                {recentDegradedCount.toLocaleString()}
                {renderProgression(recentDegradedCount, prevDegradedCount)}
              </div>
            </div>
          </div>
          <div className="hover:bg-carbon-50/10 hover:dark:bg-carbon-800 rounded border p-3 shadow-xs">
            <h3 className="mb-2 text-sm font-medium">Error</h3>
            <div className="flex items-center justify-between">
              <div className="font-mono text-red-700">
                {recentErrorCount.toLocaleString()}
                {renderProgression(recentErrorCount, prevErrorCount)}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded border p-3 shadow-xs">
            <h3 className="mb-2 text-sm font-medium">Latency p50</h3>
            <div className="flex items-center">
              <span className="text-muted-foreground font-mono">{p50}ms</span>
              {renderLatencyProgression(p50, prevP50)}
            </div>
          </div>
          <div className="rounded border p-3 shadow-xs">
            <h3 className="mb-2 text-sm font-medium">Latency p95</h3>
            <div className="flex items-center">
              <span className="text-muted-foreground font-mono">{p95}ms</span>
              {renderLatencyProgression(p95, prevP95)}
            </div>
          </div>
          <div className="rounded border p-3 shadow-xs">
            <h3 className="mb-2 text-sm font-medium">Latency p99</h3>
            <div className="flex items-center">
              <span className="text-muted-foreground font-mono">{p99}ms</span>
              {renderLatencyProgression(p99, prevP99)}
            </div>
          </div>
        </div>
      </div>
      <div>
        <MonitorTimelineChart logs={logs} />
      </div>
    </div>
  );
}
