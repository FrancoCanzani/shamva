import { TableCell, TableRow } from "@/frontend/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { Log, Monitor } from "@/frontend/lib/types";
import { cn, getRegionFlags, getStatusColor } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Link } from "@tanstack/react-router";
import {
  format,
  formatDistanceToNowStrict,
  isAfter,
  parseISO,
  subHours,
} from "date-fns";
import { ChevronRight } from "lucide-react";
import MonitorsTableRowAvailabilityDisplay from "./monitors-table-row-availability";

const calculateAvailability = (
  logs: Partial<Log>[],
  hours: number,
): { percentage: number; success: number; total: number } => {
  const now = new Date();
  const timeLimit = subHours(now, hours);
  const relevantLogs = logs.filter(
    (log) => log.created_at && isAfter(parseISO(log.created_at), timeLimit),
  );

  if (relevantLogs.length === 0) {
    return { percentage: 100, success: 0, total: 0 };
  }

  // Only count logs with valid status code
  const validLogs = relevantLogs.filter(
    (log) => typeof log.status_code === "number",
  );

  if (validLogs.length === 0) {
    return { percentage: 0, success: 0, total: relevantLogs.length };
  }

  const successCount = validLogs.filter(
    (log) => log.status_code && log.status_code >= 200 && log.status_code < 300,
  ).length;

  const totalCount = validLogs.length;
  const percentage = (successCount / totalCount) * 100;

  return { percentage, success: successCount, total: totalCount };
};

const calculateAverageLatency = (logs: Partial<Log>[]): number | null => {
  const validLatencies = logs
    .map((log) => log.latency)
    .filter(
      (latency): latency is number =>
        typeof latency === "number" && latency >= 0,
    );

  if (validLatencies.length === 0) {
    return null;
  }

  const sum = validLatencies.reduce((acc, val) => acc + val, 0);
  return sum / validLatencies.length;
};

const getStatusColorForCheck = (log: Partial<Log> | undefined): string => {
  if (!log) return "bg-gray-200";

  if (typeof log.status_code !== "number") {
    return log.error ? "bg-red-500" : "bg-gray-400";
  }

  if (log.status_code >= 200 && log.status_code < 300) return "bg-green-500";
  return "bg-red-500";
};

const getStatusText = (log: Partial<Log> | undefined): string => {
  if (!log) return "No data";

  if (typeof log.status_code !== "number") {
    return log.error ? `Error: ${log.error}` : "Unknown status";
  }

  if (log.status_code >= 200 && log.status_code < 300) return "Success";
  if (log.error) return `Error: ${log.error}`;
  return `Failed (${log.status_code})`;
};

interface RecentChecksProps {
  logs: Partial<Log>[];
}

function RecentChecks({ logs }: RecentChecksProps) {
  const recent = logs.slice(0, 7).reverse();

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1">
        {Array.from({ length: 7 }).map((_, index) => {
          const log = recent[index];
          const color = getStatusColorForCheck(log);
          const statusText = getStatusText(log);

          const title = log
            ? `${statusText} ${log.status_code ? `(${log.status_code})` : ""} at ${log.created_at ? format(parseISO(log.created_at), "HH:mm:ss") : "Unknown time"}`
            : `Check ${index + 1} (No data)`;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className={cn("h-4 w-1", color)} aria-label={title} />
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

interface MonitorRowProps {
  monitor: Monitor;
}

export default function MonitorsTableRow({ monitor }: MonitorRowProps) {
  const avgLatency = calculateAverageLatency(monitor.recent_logs);
  const availability24h = calculateAvailability(monitor.recent_logs, 24);
  const availability7d = calculateAvailability(monitor.recent_logs, 7 * 24);
  const lastCheck = monitor.last_check_at
    ? formatDistanceToNowStrict(parseISO(monitor.last_check_at), {
        addSuffix: true,
      })
    : "N/A";

  const mostRecentLog =
    monitor.recent_logs && monitor.recent_logs.length > 0
      ? monitor.recent_logs[0]
      : undefined;

  const { workspaceName } = Route.useParams();

  return (
    <TableRow
      key={monitor.id}
      className="group hover:bg-slate-50 transition-colors border-dashed"
    >
      <TableCell className="w-8">
        <div
          className={cn("w-3 h-3", getStatusColor(mostRecentLog?.status_code))}
          title={`Status: ${mostRecentLog?.status_code ?? "Unknown"}`}
        />
      </TableCell>
      <TableCell>
        <span className="capitalize text-muted-foreground">
          {monitor.status}
        </span>
      </TableCell>
      <TableCell className="max-w-xs">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ id: monitor.id, workspaceName: workspaceName }}
          search={{ days: 30 }}
          className="truncate hover:underline"
        >
          {monitor.name ?? monitor.url}
        </Link>
      </TableCell>
      <TableCell>
        <span>{lastCheck}</span>
      </TableCell>
      <TableCell>
        <RecentChecks logs={monitor.recent_logs} />
      </TableCell>
      <TableCell className="text-left">
        <MonitorsTableRowAvailabilityDisplay
          label="24h"
          availability={availability24h}
        />
      </TableCell>
      <TableCell className="text-left">
        <MonitorsTableRowAvailabilityDisplay
          label="7d"
          availability={availability7d}
        />
      </TableCell>
      <TableCell className="text-left">
        <span className="text-sm font-mono">
          {avgLatency !== null ? `${avgLatency.toFixed(0)}ms` : "N/A"}
        </span>
      </TableCell>
      <TableCell className="text-left">
        <span className="text-sm text-gray-500">
          {getRegionFlags(monitor.regions)}
        </span>
      </TableCell>
      <TableCell className="w-8 pl-2 pr-4">
        <Link
          to="/dashboard/$workspaceName/monitors/$id"
          params={{ id: monitor.id, workspaceName: workspaceName }}
          search={{ days: 30 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Details for ${monitor.url}`}
        >
          <ChevronRight size={18} className="text-gray-400" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
