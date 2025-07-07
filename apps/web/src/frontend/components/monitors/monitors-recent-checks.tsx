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
  const referenceDate = new Date();

  const dates = Array.from({ length: 7 }).map((_, i) =>
    startOfDay(subDays(referenceDate, 6 - i))
  );

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
      return "bg-carbon-200 dark:bg-carbon-800";
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
                  className={cn("h-5 w-1.5 rounded-[1px] shadow-xs", color)}
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
                              "h-2 w-2 rounded-[1px]",
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
