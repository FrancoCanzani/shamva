import type { Log } from "@/frontend/lib/types";
import { format, startOfDay, differenceInDays, differenceInHours } from "date-fns";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

interface LatencyLineChartProps {
  logs: Partial<Log>[];
  height?: number;
}

const getPercentile = (data: number[], percentile: number): number => {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  if (Number.isInteger(index)) {
    return Math.round(sorted[index]);
  }
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return Math.round(sorted[lower]);
  return Math.round(
    sorted[lower] * (upper - index) + sorted[upper] * (index - lower)
  );
};

const groupLogsBy5Minutes = (logs: Partial<Log>[]) => {
  const fiveMinGroups = new Map<string, Partial<Log>[]>();

  logs.forEach((log) => {
    if (!log.created_at) return;
    const date = new Date(log.created_at);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / 5) * 5;
    const roundedDate = new Date(date);
    roundedDate.setMinutes(roundedMinutes, 0, 0);
    
    const dateKey = format(roundedDate, "yyyy-MM-dd-HH-mm");
    if (!fiveMinGroups.has(dateKey)) {
      fiveMinGroups.set(dateKey, []);
    }
    fiveMinGroups.get(dateKey)!.push(log);
  });

  return Array.from(fiveMinGroups.entries())
    .map(([dateKey, fiveMinLogs]) => {
      const latencies = fiveMinLogs
        .map((log) => log.latency || 0)
        .filter((l) => l > 0);
      if (latencies.length === 0) return null;

      const avg = Math.round(
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      );
      const median = getPercentile(latencies, 50);
      const p95 = getPercentile(latencies, 95);
      const p99 = getPercentile(latencies, 99);

      return { date: dateKey, avg, median, p95, p99 };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const groupLogsBy15Minutes = (logs: Partial<Log>[]) => {
  const fifteenMinGroups = new Map<string, Partial<Log>[]>();

  logs.forEach((log) => {
    if (!log.created_at) return;
    const date = new Date(log.created_at);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / 15) * 15;
    const roundedDate = new Date(date);
    roundedDate.setMinutes(roundedMinutes, 0, 0);
    
    const dateKey = format(roundedDate, "yyyy-MM-dd-HH-mm");
    if (!fifteenMinGroups.has(dateKey)) {
      fifteenMinGroups.set(dateKey, []);
    }
    fifteenMinGroups.get(dateKey)!.push(log);
  });

  return Array.from(fifteenMinGroups.entries())
    .map(([dateKey, fifteenMinLogs]) => {
      const latencies = fifteenMinLogs
        .map((log) => log.latency || 0)
        .filter((l) => l > 0);
      if (latencies.length === 0) return null;

      const avg = Math.round(
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      );
      const median = getPercentile(latencies, 50);
      const p95 = getPercentile(latencies, 95);
      const p99 = getPercentile(latencies, 99);

      return { date: dateKey, avg, median, p95, p99 };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const groupLogsBy30Minutes = (logs: Partial<Log>[]) => {
  const thirtyMinGroups = new Map<string, Partial<Log>[]>();

  logs.forEach((log) => {
    if (!log.created_at) return;
    const date = new Date(log.created_at);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / 30) * 30;
    const roundedDate = new Date(date);
    roundedDate.setMinutes(roundedMinutes, 0, 0);
    
    const dateKey = format(roundedDate, "yyyy-MM-dd-HH-mm");
    if (!thirtyMinGroups.has(dateKey)) {
      thirtyMinGroups.set(dateKey, []);
    }
    thirtyMinGroups.get(dateKey)!.push(log);
  });

  return Array.from(thirtyMinGroups.entries())
    .map(([dateKey, thirtyMinLogs]) => {
      const latencies = thirtyMinLogs
        .map((log) => log.latency || 0)
        .filter((l) => l > 0);
      if (latencies.length === 0) return null;

      const avg = Math.round(
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      );
      const median = getPercentile(latencies, 50);
      const p95 = getPercentile(latencies, 95);
      const p99 = getPercentile(latencies, 99);

      return { date: dateKey, avg, median, p95, p99 };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const groupLogsByDay = (logs: Partial<Log>[]) => {
  const dailyGroups = new Map<string, Partial<Log>[]>();

  logs.forEach((log) => {
    if (!log.created_at) return;
    const date = startOfDay(new Date(log.created_at));
    const dateKey = format(date, "yyyy-MM-dd");
    if (!dailyGroups.has(dateKey)) {
      dailyGroups.set(dateKey, []);
    }
    dailyGroups.get(dateKey)!.push(log);
  });

  return Array.from(dailyGroups.entries())
    .map(([dateKey, dayLogs]) => {
      const latencies = dayLogs
        .map((log) => log.latency || 0)
        .filter((l) => l > 0);
      if (latencies.length === 0) return null;

      const avg = Math.round(
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      );
      const median = getPercentile(latencies, 50);
      const p95 = getPercentile(latencies, 95);
      const p99 = getPercentile(latencies, 99);

      return { date: dateKey, avg, median, p95, p99 };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const groupLogsByTime = (logs: Partial<Log>[]) => {
  if (logs.length === 0) return [];

  const dates = logs
    .map((log) => log.created_at)
    .filter((date): date is string => !!date)
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return [];

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const daysDifference = differenceInDays(lastDate, firstDate);
  const hoursDifference = differenceInHours(lastDate, firstDate);

  if (hoursDifference < 2) {
    return groupLogsBy5Minutes(logs);
  }

  if (hoursDifference < 6) {
    return groupLogsBy15Minutes(logs);
  }

  if (hoursDifference < 12) {
    return groupLogsBy30Minutes(logs);
  }

  if (daysDifference === 0) {
    return groupLogsBy15Minutes(logs);
  }

  if (daysDifference <= 3) {
    return groupLogsBy30Minutes(logs);
  }

  return groupLogsByDay(logs);
};

export default function LatencyLineChart({
  logs,
  height = 200,
}: LatencyLineChartProps) {
  const chartData = groupLogsByTime(logs);

  if (chartData.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center p-4"
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">
          No latency data available
        </p>
      </div>
    );
  }

  const chartConfig = {
    avg: { label: "Average", color: "#87CEEB" },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="max-h-80 w-full"
      style={{ height }}
    >
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={0}
          tick={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={0}
          tickFormatter={(value) => `${value}ms`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => {
                try {
                  if (label.includes("-") && label.split("-").length === 5) {
                    const parts = label.split("-");
                    const [year, month, day, hour, minute] = parts;
                    const date = new Date(
                      parseInt(year),
                      parseInt(month) - 1,
                      parseInt(day),
                      parseInt(hour),
                      parseInt(minute)
                    );
                    if (!isNaN(date.getTime())) {
                      return format(date, "MMM d, yyyy 'at' h:mm a");
                    }
                  }
                  
                  if (label.includes("-") && label.split("-").length === 4) {
                    const parts = label.split("-");
                    const [year, month, day, hour] = parts;
                    const date = new Date(
                      parseInt(year),
                      parseInt(month) - 1,
                      parseInt(day),
                      parseInt(hour)
                    );
                    if (!isNaN(date.getTime())) {
                      return format(date, "MMM d, yyyy 'at' h:00 a");
                    }
                  }
                  
                  if (label.includes("-") && label.split("-").length === 3) {
                    const date = new Date(label);
                    if (!isNaN(date.getTime())) {
                      return format(date, "MMM d, yyyy");
                    }
                  }
                  
                  const date = new Date(label);
                  if (!isNaN(date.getTime())) {
                    return format(date, "MMM d, yyyy 'at' h:mm a");
                  }
                  
                  return label;
                } catch (error) {
                  console.error("Error formatting date label:", error, label);
                  return label;
                }
              }}
            />
          }
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="avg"
          stroke="#b3b3b3"
          fill="#b3b3b3"
          fillOpacity={0.25}
          strokeWidth={0.5}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

