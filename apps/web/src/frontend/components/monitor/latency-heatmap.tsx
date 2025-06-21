import type { Log } from "@/frontend/lib/types";
import { format, startOfHour, eachDayOfInterval, lastDayOfMonth } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface LatencyHeatmapProps {
  logs: Partial<Log>[];
  height?: number;
}

const createHeatmapData = (logs: Partial<Log>[]) => {
  if (logs.length === 0) return [];

  const hourlyGroups = new Map<string, number[]>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  logs.forEach((log) => {
    if (!log.created_at || !log.latency) return;
    const date = new Date(log.created_at);
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;

    const hourKey = format(startOfHour(date), "yyyy-MM-dd-HH");
    if (!hourlyGroups.has(hourKey)) {
      hourlyGroups.set(hourKey, []);
    }
    hourlyGroups.get(hourKey)!.push(log.latency);
  });

  if (!minDate || !maxDate) return [];

  const interval = eachDayOfInterval({ start: minDate, end: lastDayOfMonth(maxDate) });

  return interval.map((day) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const values = Array.from({ length: 24 }, (_, hour) => {
      const hourKey = `${dayKey}-${String(hour).padStart(2, '0')}`;
      const latencies = hourlyGroups.get(hourKey);
      if (!latencies || latencies.length === 0) return null;
      const avgLatency = Math.round(
        latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      );
      return { hour, avgLatency };
    });
    return { date: dayKey, values };
  });
};

const getLatencyColor = (latency: number | null): string => {
  if (latency === null || latency < 0)
    return "bg-carbon-200 dark:bg-carbon-800";
  if (latency < 100) return "bg-green-400/80";
  if (latency < 250) return "bg-green-500/80";
  if (latency < 500) return "bg-yellow-400/80";
  if (latency < 1000) return "bg-orange-500/80";
  return "bg-red-600/80";
};

export default function LatencyHeatmap({ logs, height = 200 }: LatencyHeatmapProps) {
  const heatmapData = createHeatmapData(logs);

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full p-4"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">
          Not enough data for heatmap.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="flex text-xs overflow-y-auto"
        style={{ height, scrollbarWidth: "thin" }}
      >
        <div className="grid flex-1 grid-cols-24 gap-1">
          {heatmapData.map(({ date, values }) =>
            values.map((data, hour) => (
              <Tooltip key={`${date}-${hour}`} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className={`w-full h-4 ${getLatencyColor(
                      data?.avgLatency ?? null
                    )}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">
                    {format(new Date(date), "MMM d, yyyy")} - {hour}:00
                  </p>
                  {data ? (
                    <p>Avg Latency: {data.avgLatency}ms</p>
                  ) : (
                    <p>No data</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))
          )}
        </div>
      </div>
      <div className="flex justify-between text-muted-foreground text-[10px] mt-1 px-1">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
    </TooltipProvider>
  );
} 