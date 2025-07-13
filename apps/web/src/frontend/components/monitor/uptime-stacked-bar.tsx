import { Log } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface UptimeStackedBarProps {
  logs: Partial<Log>[];
  className?: string;
}

export function UptimeStackedBar({
  logs,
  className = "",
}: UptimeStackedBarProps) {
  const { days } = Route.useSearch();

  const generateDailyData = () => {
    const dailyData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayLogs = logs.filter((log) => {
        if (!log.created_at) return false;
        const logDate = new Date(log.created_at).toISOString().split("T")[0];
        return logDate === dateStr;
      });

      const success = dayLogs.filter(
        (log) => typeof log.ok === "boolean" && log.ok === true
      ).length;
      const error = dayLogs.filter(
        (log) => typeof log.ok === "boolean" && log.ok === false
      ).length;
      const degraded = dayLogs.length - success - error;

      dailyData.push({
        date: dateStr,
        success,
        degraded,
        error,
        total: dayLogs.length,
      });
    }

    return dailyData;
  };

  const dailyData = generateDailyData();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUptimePercentage = (day: any) => {
    if (day.total === 0) return 0;
    return Math.round((day.success / day.total) * 100);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-muted-foreground text-sm font-medium">
        Last {days} Days
      </h3>

      <div className="flex items-center gap-1">
        {dailyData.map((day, index) => {
          const total = day.total;
          const uptimePercent = getUptimePercentage(day);

          if (total === 0) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className="bg-carbon-50 dark:bg-carbon-800 h-8 flex-1"
                    title={`${formatDate(day.date)}: No data`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="">
                    <div className="font-medium">{formatDate(day.date)}</div>
                    <div className="text-muted-foreground text-sm">
                      No data available
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }

          const successPercent = (day.success / total) * 100;
          const degradedPercent = (day.degraded / total) * 100;
          const errorPercent = (day.error / total) * 100;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex h-8 flex-1">
                  {successPercent > 0 && (
                    <div
                      className="flex items-center justify-center bg-green-800"
                      style={{ width: `${successPercent}%` }}
                    ></div>
                  )}
                  {degradedPercent > 0 && (
                    <div
                      className="flex items-center justify-center bg-yellow-400"
                      style={{ width: `${degradedPercent}%` }}
                    >
                      {degradedPercent > 15 && (
                        <span className="text-xs font-medium text-white">
                          {day.degraded}
                        </span>
                      )}
                    </div>
                  )}
                  {errorPercent > 0 && (
                    <div
                      className="flex items-center justify-center bg-red-800"
                      style={{ width: `${errorPercent}%` }}
                    >
                      {errorPercent > 15 && (
                        <span className="text-xs font-medium text-white">
                          {day.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-center">
                  <div className="font-medium">{formatDate(day.date)}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="">Success:</span>
                      <span className="font-medium">{day.success}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="">Degraded:</span>
                      <span className="font-medium">{day.degraded}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="">Error:</span>
                      <span className="font-medium">{day.error}</span>
                    </div>
                    <div className="border-border mt-2 border-t pt-1">
                      <div className="flex items-center justify-between gap-4 font-medium">
                        <span>Uptime:</span>
                        <span>{uptimePercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
