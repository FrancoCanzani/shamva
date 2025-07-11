import type { Monitor } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import LatencyMiniChart from "./latency-mini-chart";

interface MonitorsGridProps {
  monitors: Monitor[];
}

function calculateUptime(logs: Partial<Monitor["recent_logs"]>) {
  const validLogs = logs.filter(
    (log): log is NonNullable<typeof log> => log !== undefined
  );
  const successCount = validLogs.filter((log) => log.ok === true).length;
  return ((successCount / validLogs.length) * 100).toFixed(1);
}

function calculateAvgLatency(logs: Partial<Monitor["recent_logs"]>) {
  const validLogs = logs.filter(
    (log): log is NonNullable<typeof log> =>
      log !== undefined && typeof log.latency === "number" && log.latency > 0
  );
  if (validLogs.length === 0) return 0;
  const sum = validLogs.reduce((acc, log) => acc + (log.latency || 0), 0);
  return Math.round(sum / validLogs.length);
}

export function MonitorsGrid({ monitors }: MonitorsGridProps) {
  const { workspaceName } = Route.useParams();
  const activeCount = monitors.filter((m) => m.status === "active").length;
  const errorCount = monitors.filter(
    (m) => m.status === "error" || m.status === "broken"
  ).length;

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center gap-6 text-xs">
          <span className="rounded border p-2 capitalize shadow-xs">
            {monitors.length} total
          </span>
          <span className="rounded border bg-green-50/50 p-2 capitalize shadow-xs dark:bg-green-900">
            {activeCount} active
          </span>
          <span className="rounded border bg-red-50/50 p-2 capitalize shadow-xs dark:bg-red-900">
            {errorCount} failing
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {monitors.map((monitor) => (
          <Link
            to="/dashboard/$workspaceName/monitors/$id"
            params={{ workspaceName: workspaceName, id: monitor.id }}
            search={{ days: 7 }}
            key={monitor.id}
            className="hover:bg-carbon-50/10 dark:hover:bg-carbon-800 space-y-4 rounded-md border p-4 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <div className="relative flex h-1.5 w-1.5">
                    <span
                      className={cn(
                        "absolute h-full w-full animate-ping rounded-xs duration-1000",
                        monitor.status === "active"
                          ? "bg-green-600"
                          : monitor.status === "error" ||
                              monitor.status === "broken"
                            ? "bg-red-600"
                            : monitor.status === "degraded"
                              ? "bg-yellow-500"
                              : monitor.status === "maintenance"
                                ? "bg-blue-600"
                                : monitor.status === "paused"
                                  ? "bg-gray-500"
                                  : "bg-gray-300"
                      )}
                    />
                    <span
                      className={cn(
                        "absolute h-1.5 w-1.5 rounded-xs",
                        monitor.status === "active"
                          ? "bg-green-600"
                          : monitor.status === "error" ||
                              monitor.status === "broken"
                            ? "bg-red-600"
                            : monitor.status === "degraded"
                              ? "bg-yellow-500"
                              : monitor.status === "maintenance"
                                ? "bg-blue-600"
                                : monitor.status === "paused"
                                  ? "bg-gray-500"
                                  : "bg-gray-300"
                      )}
                    />
                  </div>
                  <h2 className="truncate text-sm font-medium">
                    {monitor.name ??
                      (monitor.check_type === "tcp"
                        ? monitor.tcp_host_port
                        : monitor.url)}
                  </h2>
                </div>
                <p className="text-muted-foreground truncate font-mono text-xs">
                  {monitor.check_type === "tcp"
                    ? monitor.tcp_host_port
                    : monitor.url}
                </p>
              </div>
              <div className="ml-2 flex-shrink-0 text-right">
                <div className="text-xs font-medium">
                  {calculateUptime(monitor.recent_logs)}%
                </div>
                <div className="text-muted-foreground text-xs">Uptime</div>
              </div>
            </div>

            <LatencyMiniChart logs={monitor.recent_logs} height={60} />

            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {calculateAvgLatency(monitor.recent_logs)}ms avg. latency
              </span>
              <span>
                Checked{" "}
                {monitor.last_check_at
                  ? formatDistanceToNow(monitor.last_check_at, {
                      addSuffix: true,
                    })
                  : "never"}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <span className="text-xs font-medium uppercase">
                {monitor.check_type}
              </span>
              <span className="text-xs capitalize">{monitor.status}</span>
            </div>
          </Link>
        ))}
      </div>

      {monitors.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No monitors found.</p>
        </div>
      )}
    </div>
  );
}
