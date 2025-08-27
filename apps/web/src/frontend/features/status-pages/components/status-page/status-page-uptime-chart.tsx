import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { PublicMonitor } from "@/frontend/lib/types";

export default function StatusPageUptimeChart({
  monitor,
  showValues,
}: {
  monitor: PublicMonitor;
  showValues: boolean;
}) {
  if (!monitor.daily_stats) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        30-Day Uptime
      </h4>
      <div className="flex gap-[2px]">
        {monitor.daily_stats.map((day, index) => {
          const uptimePercentage = day.uptime_percentage;
          let barColor = "#e5e7eb"; // gray-200 for no data

          if (uptimePercentage !== null) {
            if (uptimePercentage >= 99) {
              barColor = "#10b981"; // green-500
            } else if (uptimePercentage >= 95) {
              barColor = "#f59e0b"; // yellow-500
            } else {
              barColor = "#ef4444"; // red-500
            }
          }

          const tooltipContent = (
            <div className="text-center space-y-1">
              <div className="font-medium text-sm">
                {new Date(day.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              {uptimePercentage !== null ? (
                <>
                  <div className="text-xs">
                    <span className="font-medium">Uptime:</span> {uptimePercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Total:</span> {day.total_requests}
                  </div>
                  {day.failed_requests > 0 && (
                    <div className="text-xs text-red-500">
                      <span className="font-medium">Failed:</span> {day.failed_requests}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-500">No data</div>
              )}
            </div>
          );

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="h-6 w-2 cursor-pointer transition-all hover:opacity-80 hover:scale-110 rounded-sm"
                  style={{ backgroundColor: barColor }}
                />
              </TooltipTrigger>
              {showValues && <TooltipContent>{tooltipContent}</TooltipContent>}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
