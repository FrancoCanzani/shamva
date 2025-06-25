import type { Log, Monitor } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, isAfter, parseISO, subHours } from "date-fns";
import { ChevronRight } from "lucide-react";
import MonitorsCardAvailabilityDisplay from "./monitors-card-availability";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useIsMobile } from "@/frontend/hooks/use-mobile";

const calculateAvailability = (
  logs: Partial<Log>[],
  hours: number,
): { percentage: number; success: number; total: number } => {
  const now = new Date();
  const timeLimit = subHours(now, hours);
  const relevantLogs = logs.filter((log) => log.created_at && isAfter(parseISO(log.created_at), timeLimit));

  if (relevantLogs.length === 0) {
    return { percentage: 100, success: 0, total: 0 };
  }

  const validLogs = relevantLogs.filter((log) => typeof log.ok === "boolean");

  if (validLogs.length === 0) {
    return { percentage: 0, success: 0, total: relevantLogs.length };
  }

  const successCount = validLogs.filter((log) => log.ok === true).length;

  const totalCount = validLogs.length;
  const percentage = (successCount / totalCount) * 100;

  return { percentage, success: successCount, total: totalCount };
};

const calculateAverageLatency = (logs: Partial<Log>[]): number | null => {
  const validLatencies = logs
    .map((log) => log.latency)
    .filter((latency): latency is number => typeof latency === "number" && latency >= 0);

  if (validLatencies.length === 0) {
    return null;
  }

  const sum = validLatencies.reduce((acc, val) => acc + val, 0);
  return sum / validLatencies.length;
};

const getStatusColorForCheck = (log: Partial<Log> | undefined): string => {
  if (!log) return "bg-gray-200";

  // For HTTP checks, use status code colors
  if (log.check_type === "http" && typeof log.status_code === "number") {
    if (log.status_code >= 200 && log.status_code < 300) return "bg-green-700";
    if (log.status_code >= 300 && log.status_code < 400) return "bg-blue-700";
    if (log.status_code >= 400 && log.status_code < 500) return "bg-orange-500";
    if (log.status_code >= 500) return "bg-red-700";
    return "bg-red-700";
  }

  // For TCP checks or when status_code is not available, use ok field
  if (typeof log.ok === "boolean") {
    return log.ok ? "bg-green-700" : "bg-red-700";
  }

  // Fallback for unknown status
  return log.error ? "bg-red-700" : "bg-gray-700";
};

const getStatusText = (log: Partial<Log> | undefined): string => {
  if (!log) return "No data";

  // For HTTP checks, show status code
  if (log.check_type === "http" && typeof log.status_code === "number") {
    if (log.status_code >= 200 && log.status_code < 300) return "Success";
    if (log.status_code >= 300 && log.status_code < 400) return `Redirect (${log.status_code})`;
    if (log.status_code >= 400 && log.status_code < 500) return `Client Error (${log.status_code})`;
    if (log.status_code >= 500) return `Server Error (${log.status_code})`;
    return `Failed (${log.status_code})`;
  }

  // For TCP checks, use ok field
  if (typeof log.ok === "boolean") {
    if (log.ok) return "Success";
    if (log.error) return `Error: ${log.error}`;
    return "Failed";
  }

  // Fallback for unknown status
  return log.error ? `Error: ${log.error}` : "Unknown status";
};

interface RecentChecksProps {
  logs: Partial<Log>[];
}

function RecentChecks({ logs }: RecentChecksProps) {

  const isMobile = useIsMobile();

  const recent = isMobile ? logs.slice(0, 7) : logs.slice(0, 10);

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1">
        {Array.from({ length: isMobile ? 7 : 10 }).map((_, index) => {
          const log = recent[index];
          const color = getStatusColorForCheck(log);
          const statusText = getStatusText(log);

          const title = log
            ? `${statusText} at ${log.created_at ? format(parseISO(log.created_at), "HH:mm:ss") : "Unknown time"}`
            : `Check ${index + 1} (No data)`;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className={cn("h-8 w-1.5 rounded-xs", color)} aria-label={title} />
              </TooltipTrigger>
              {log && (
                <TooltipContent side="top" className="text-xs">
                  <p>{title}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

interface MonitorCardProps {
  monitor: Monitor;
  workspaceName: string;
}

export default function MonitorsCard({ monitor, workspaceName }: MonitorCardProps) {
  const avgLatency = calculateAverageLatency(monitor.recent_logs);
  const availability24h = calculateAvailability(monitor.recent_logs, 24);
  const availability7d = calculateAvailability(monitor.recent_logs, 7 * 24);
  const lastCheck = monitor.last_check_at
    ? formatDistanceToNowStrict(parseISO(monitor.last_check_at), {
        addSuffix: true,
      })
    : "-";

  const mostRecentLog = monitor.recent_logs && monitor.recent_logs.length > 0 ? monitor.recent_logs[0] : undefined;

  const getMonitorStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-700 dark:bg-green-700";
      case "broken":
      case "error":
        return "bg-red-700 dark:bg-red-700";
      case "degraded":
        return "bg-yellow-500 dark:bg-yellow-500";
      case "maintenance":
        return "bg-blue-700 dark:bg-blue-700";
      case "paused":
        return "bg-gray-500 dark:bg-gray-500";
      default:
        return "bg-slate-200 dark:bg-slate-700";
    }
  };

  return (
    <div className="group border shadow-xs rounded-xs">
      <Link 
        to="/dashboard/$workspaceName/monitors/$id"
        params={{ id: monitor.id, workspaceName: workspaceName }}
        search={{ days: 30 }}
        className="block px-2 py-2.5 bg-background hover:bg-slate-50 dark:hover:bg-carbon-800 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <div
                className={cn("w-2 h-2 rounded-xs", getMonitorStatusColor(monitor.status))}
                title={`Status: ${monitor.status}`}
              />
              <span className="text-sm font-medium truncate">
                {monitor.name ?? (monitor.check_type === "tcp" ? monitor.tcp_host_port : monitor.url)}
              </span>
              <span className="text-xs text-muted-foreground capitalize hidden sm:inline">{monitor.status}</span>
            </div>
            <span className="text-xs text-muted-foreground">Last checked {lastCheck}</span>
          </div>

          <div className="flex items-center md:space-x-3 sm:space-x-6 text-xs">
            <div className="flex items-center flex-col space-y-0.5">
              <span className="text-muted-foreground text-[8px]">- Recent- </span>
              <RecentChecks logs={monitor.recent_logs} />
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-center hidden sm:block">
                <div className="text-muted-foreground mb-1 w-8 hidden sm:block">24h</div>
                <MonitorsCardAvailabilityDisplay label="24h" availability={availability24h} />
              </div>

              <div className="text-center hidden sm:block">
                <div className="text-muted-foreground mb-1 w-8">7d</div>
                <MonitorsCardAvailabilityDisplay label="7d" availability={availability7d} />
              </div>

              <div className="text-center hidden sm:block">
                <div className="text-muted-foreground mb-1 hidden sm:block">Latency</div>
                <span className="font-mono">
                  {avgLatency !== null ? `${avgLatency.toFixed(0)}ms` : "-"}
                </span>
              </div>
            </div>

            <ChevronRight
              size={16}
              className="text-carbon-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </div>
  );
} 