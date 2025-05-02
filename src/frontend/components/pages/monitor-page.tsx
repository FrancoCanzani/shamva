import {
  cn,
  getRegionFlags,
  getStatusTextColor,
  groupLogsByRegion,
} from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/monitors/$id";
import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft, ExternalLink } from "lucide-react";
import RegionLatencyCharts from "../monitor/region-latency-charts";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function MonitorPage() {
  const monitor = Route.useLoaderData();

  const lastCheck = monitor.last_check_at
    ? formatDistanceToNowStrict(parseISO(monitor.last_check_at), {
        addSuffix: true,
      })
    : "Never";

  const successRate =
    monitor.success_count + monitor.failure_count > 0
      ? Math.round(
          (monitor.success_count /
            (monitor.success_count + monitor.failure_count)) *
            100,
        )
      : 0;

  const groupedLogs = groupLogsByRegion(monitor.recent_logs);

  console.log(groupedLogs);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6 flex-shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/monitors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="flex-1 text-lg font-semibold md:text-xl truncate">
          {monitor.name || "Monitor Details"}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500">
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-6 overflow-y-auto space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className={`size-3 rounded-full`}></div>
            <span
              className={cn(
                "text-xl font-medium capitalize",
                getStatusTextColor(monitor.recent_logs[0]?.status_code),
              )}
            >
              {monitor.status}
            </span>
            <span className="text-sm text-muted-foreground">
              Last checked {lastCheck}
            </span>
          </div>

          <div className="flex items-baseline gap-2 break-all">
            <div className="text-sm text-muted-foreground min-w-16">URL</div>
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm hover:underline flex-grow"
            >
              {monitor.url}
              <ExternalLink className="inline ml-1 h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex gap-2 min-w-32">
              <div className="text-sm text-muted-foreground">Method:</div>
              <div className="text-sm font-medium">{monitor.method}</div>
            </div>
            <div className="flex gap-2 min-w-32">
              <div className="text-sm text-muted-foreground">Interval:</div>
              <div className="text-sm font-medium">
                {monitor.interval / 60000} min
              </div>
            </div>
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground">Regions:</div>
              <div className="text-sm">{getRegionFlags(monitor.regions)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-y py-4 border-gray-100 dark:border-gray-800">
            <div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className="text-xl font-medium">{successRate}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Checks</div>
              <div className="text-xl font-medium">
                {monitor.success_count + monitor.failure_count}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Successes</div>
              <div className="text-xl font-medium text-green-500">
                {monitor.success_count}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Failures</div>
              <div className="text-xl font-medium text-red-500">
                {monitor.failure_count}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium mb-4">Latency Trends by Region</h2>
          <RegionLatencyCharts logs={monitor.recent_logs} height={36} />
        </div>

        <Separator />

        <div>
          <h2 className="text-sm font-medium mb-4">Recent Checks</h2>

          {monitor.error_message && (
            <div className="mb-4 py-2 px-3 border-l-2 border-red-500 bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-sm">
              {monitor.error_message}
            </div>
          )}

          {monitor.recent_logs && monitor.recent_logs.length > 0 ? (
            <div className="space-y-2">
              {monitor.recent_logs.slice(0, 10).map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-center gap-3 text-sm py-1 border-b border-dashed last:border-0"
                >
                  <div
                    className={cn(
                      "size-2 rounded-full",
                      log.status_code &&
                        log.status_code >= 200 &&
                        log.status_code < 300
                        ? "bg-green-500"
                        : log.status_code &&
                            log.status_code >= 300 &&
                            log.status_code < 400
                          ? "bg-blue-500"
                          : log.status_code &&
                              log.status_code >= 400 &&
                              log.status_code < 500
                            ? "bg-yellow-500"
                            : "bg-red-500",
                    )}
                  />
                  <div className="w-16 font-mono text-xs">
                    {log.status_code || "ERR"}
                  </div>
                  <div className="w-24 font-mono text-xs">
                    {log.latency && log.latency >= 0
                      ? `${Math.round(log.latency)}ms`
                      : "N/A"}
                  </div>
                  <div className="text-xs w-20">{log.colo || "N/A"}</div>
                  <div className="text-xs text-muted-foreground ml-auto">
                    {log.created_at &&
                      format(parseISO(log.created_at), "MMM dd, HH:mm:ss")}
                  </div>
                </div>
              ))}

              {monitor.recent_logs.length > 10 && (
                <Button
                  variant="ghost"
                  className="w-full mt-2 h-8 text-xs"
                  size="sm"
                >
                  View all logs
                </Button>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No recent logs available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
