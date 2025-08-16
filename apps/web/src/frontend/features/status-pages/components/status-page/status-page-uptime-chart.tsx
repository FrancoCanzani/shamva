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
    <div className="">
      <h4 className="mb-2 text-xs text-black uppercase">30-DAY UPTIME</h4>
      <div className="flex gap-[2px]">
        {monitor.daily_stats.map((day, index) => {
          const uptimePercentage = day.uptime_percentage;
          let barColor = "#e5e7eb"; // gray-200 for no data

          if (uptimePercentage !== null) {
            if (uptimePercentage >= 99) {
              barColor = "#10b981"; // green-500
            } else if (uptimePercentage >= 95) {
              barColor = "var(--color-degraded)";
            } else {
              barColor = "var(--color-error)";
            }
          }

          const tooltipContent = (
            <div className="text-center">
              <div className="font-medium">
                {new Date(day.date).toLocaleDateString()}
              </div>
              {uptimePercentage !== null ? (
                <>
                  <div>Uptime: {uptimePercentage.toFixed(1)}%</div>
                  <div>Total: {day.total_requests}</div>
                  <div>Failed: {day.failed_requests}</div>
                </>
              ) : (
                <div>No data</div>
              )}
            </div>
          );

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className="h-8 w-2 cursor-pointer transition-opacity hover:opacity-80"
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
