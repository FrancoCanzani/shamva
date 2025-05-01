import { TableCell, TableRow } from "@/frontend/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { Log, Monitor } from "@/frontend/lib/types";
import { cn, getRegionFlags, getStatusColor } from "@/frontend/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  format,
  formatDistanceToNowStrict,
  isAfter,
  parseISO,
  subHours,
} from "date-fns";
import { ChevronRight } from "lucide-react";

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

  const successCount = relevantLogs.filter(
    (log) => log.status_code! >= 200 && log.status_code! < 300,
  ).length;
  const totalCount = relevantLogs.length;
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

const getStatusColorForCheck = (ok?: boolean | null): string => {
  if (ok === true) return "bg-green-500";
  if (ok === false) return "bg-red-500";
  return "bg-gray-400";
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
          const color = log
            ? getStatusColorForCheck(
                log.status_code! >= 200 && log.status_code! < 300,
              )
            : "bg-gray-200";
          const title = log
            ? `${log.status_code! >= 200 && log.status_code! < 300 ? "Success" : log.error ? "Error" : "Failed"} (${log.status_code ?? "N/A"}) at ${log.created_at ? format(parseISO(log.created_at), "HH:mm:ss") : "Unknown time"}`
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

interface AvailabilityDisplayProps {
  label: string;
  availability: { percentage: number; success: number; total: number };
}

function AvailabilityDisplay({
  label,
  availability,
}: AvailabilityDisplayProps) {
  const formattedPercentage =
    availability.total > 0 ? `${availability.percentage.toFixed()}%` : "N/A";

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "text-sm font-medium font-mono",
              availability.percentage < 95 && availability.total > 0
                ? "text-red-600"
                : availability.percentage < 100 && availability.total > 0
                  ? "text-yellow-600"
                  : "text-gray-700",
            )}
          >
            {formattedPercentage}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>
            {label}: {availability.success} successful / {availability.total}{" "}
            checks
          </p>
        </TooltipContent>
      </Tooltip>
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

  return (
    <TableRow
      key={monitor.id}
      className="group hover:bg-slate-50 transition-colors border-dashed"
    >
      <TableCell className="w-8">
        <div
          className={cn(
            "w-3 h-3",
            getStatusColor(monitor.recent_logs[0].status_code),
          )}
          title={`Status: ${monitor.recent_logs[0].status_code}`}
        />
      </TableCell>
      <TableCell>
        <span className="capitalize text-muted-foreground">
          {monitor.status}
        </span>
      </TableCell>
      <TableCell className="max-w-xs">
        <Link
          to="/dashboard/monitors/$slug"
          params={{ slug: monitor.id }}
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
        <AvailabilityDisplay label="24h" availability={availability24h} />
      </TableCell>
      <TableCell className="text-left">
        <AvailabilityDisplay label="7d" availability={availability7d} />
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
          to="/dashboard/monitors/$slug"
          params={{ slug: monitor.id }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Details for ${monitor.url}`}
        >
          <ChevronRight size={18} className="text-gray-400" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
