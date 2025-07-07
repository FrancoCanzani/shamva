import { Log } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { format, isSameDay, parseISO, startOfDay, subDays } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { getStatusColorForCheck } from "./monitors-table-utils";

export default function RecentChecks({ logs }: { logs: Partial<Log>[] }) {
  const getReferenceDate = () => {
    if (!logs || logs.length === 0) {
      return new Date();
    }
    const mostRecentLog = logs.reduce((latest, current) => {
      if (!latest.created_at) return current;
      if (!current.created_at) return latest;
      return new Date(current.created_at) > new Date(latest.created_at)
        ? current
        : latest;
    });

    return mostRecentLog.created_at
      ? parseISO(mostRecentLog.created_at)
      : new Date();
  };

  const referenceDate = getReferenceDate();

  const dates = Array.from({ length: 7 })
    .map((_, i) => startOfDay(subDays(referenceDate, i)))
    .reverse();

  const groupedLogs = dates.map((date) => {
    const dayLogs = logs
      .filter(
        (log) => log.created_at && isSameDay(parseISO(log.created_at), date)
      )
      .sort(
        (a, b) =>
          new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
      );
    return { date, logs: dayLogs };
  });

  const getSeverity = (log: Partial<Log> | undefined): number => {
    const color = getStatusColorForCheck(log);
    if (color.includes("red")) return 3;
    if (color.includes("yellow") || color.includes("orange")) return 2;
    if (color.includes("green")) return 1;
    return 0;
  };

  const getDayStatusColor = (dayLogs: Partial<Log>[]): string => {
    if (dayLogs.length === 0) {
      return "bg-slate-200 dark:bg-slate-700";
    }

    const mostSevereLog = dayLogs.reduce((max, log) =>
      getSeverity(log) > getSeverity(max) ? log : max
    );

    return getStatusColorForCheck(mostSevereLog);
  };

  const groupChecksByStatus = (dayLogs: Partial<Log>[]) => {
    return dayLogs.reduce(
      (acc, log) => {
        let status: string;
        if (log.check_type === "tcp") {
          status = log.ok ? "ok" : "error";
        } else {
          status = String(log.status_code || "Unknown");
        }

        if (!acc[status]) {
          acc[status] = { count: 0, log };
        }
        acc[status].count += 1;
        return acc;
      },
      {} as Record<string, { count: number; log: Partial<Log> }>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1">
        {groupedLogs.map(({ date, logs: dayLogs }, index) => {
          const color = getDayStatusColor(dayLogs);
          const title =
            dayLogs.length > 0
              ? `${dayLogs.length} checks on ${format(date, "MMM d")}`
              : `No checks on ${format(date, "MMM d")}`;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={cn("h-5 w-1.5 rounded-xs shadow-xs", color)}
                  aria-label={title}
                />
              </TooltipTrigger>
              {dayLogs.length > 0 && (
                <TooltipContent side="top" className="text-xs">
                  <p className="font-bold">{format(date, "MMMM d, yyyy")}</p>
                  <ul className="list-none p-0">
                    {Object.entries(groupChecksByStatus(dayLogs)).map(
                      ([statusCode, { count, log }]) => (
                        <li
                          key={statusCode}
                          className="flex items-center space-x-1.5"
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              getStatusColorForCheck(log)
                            )}
                          />
                          <span>
                            {count} - {statusCode}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
