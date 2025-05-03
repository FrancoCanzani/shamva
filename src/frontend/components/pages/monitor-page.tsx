import { supabase } from "@/frontend/lib/supabase";
import {
  cn,
  getRegionFlags,
  getStatusColor,
  groupLogsByRegion,
} from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/monitors/$id";
import { Link, redirect, useNavigate } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import RegionLatencyCharts from "../monitor/region-latency-charts";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function MonitorPage() {
  const navigate = useNavigate();
  const monitor = Route.useLoaderData();
  const { id } = Route.useParams();

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
    <div className="flex flex-1 w-full max-w-6xl mx-auto p-4 flex-col">
      <Link
        to="/dashboard/monitors"
        className="flex items-center justify-start text-xs gap-1 text-muted-foreground"
      >
        <ArrowLeft className="size-3" />
        <span>Back to monitors</span>
      </Link>

      <div className="flex tems-center justify-between gap-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-start gap-1">
          <h1 className="flex-1 font-medium">{monitor.name || monitor.url}</h1>
          {monitor.name && (
            <a
              href={monitor.url}
              className="text-xs hover:underline text-muted-foreground"
            >
              {monitor.url}
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard/monitors/$id/edit" params={{ id: monitor.id }}>
            Edit
          </Link>
          <Button
            onClick={async () => {
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError || !session?.access_token) {
                console.error("Session Error or no token:", sessionError);
                throw redirect({
                  to: "/auth/login",
                  search: { redirect: `/dashboard/monitors/${id}` },
                  throw: true,
                });
              }

              const token = session.access_token;

              try {
                const response = await fetch(`/api/monitors/${id}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                });

                const result = await response.json();

                console.log(result);

                if (response.ok) {
                  toast.success("Monitor deleted");
                  navigate({
                    to: "/dashboard/monitors",
                  });
                } else {
                  toast.error("Error deleting monitor");
                }
              } catch (error) {
                console.error("Error deleting monitor:", error);
                toast.error("Error deleting monitor");
              }
            }}
            variant="ghost"
            size="sm"
            className="text-red-500"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto space-y-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button>
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 duration-[2000ms]",
                    getStatusColor(monitor.recent_logs[0]?.status_code),
                  )}
                ></span>
                <span
                  className={cn(
                    "absolute inline-flex h-2 w-2 rounded-full bg-red-500",
                    getStatusColor(monitor.recent_logs[0]?.status_code),
                  )}
                ></span>
              </span>
            </button>
            <span className={cn("font-medium capitalize")}>
              {monitor.status}
            </span>
            <span className="text-sm text-muted-foreground">
              Last checked {lastCheck}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground">Method:</div>
              <div className="text-sm font-medium">{monitor.method}</div>
            </div>
            <div className="flex gap-2">
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
                      getStatusColor(log.status_code),
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
