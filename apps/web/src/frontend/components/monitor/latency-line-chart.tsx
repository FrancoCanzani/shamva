import type { Log } from "@/frontend/lib/types";
import { format, startOfDay, startOfHour, differenceInDays } from "date-fns";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
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

const groupLogsByHour = (logs: Partial<Log>[]) => {
  const hourlyGroups = new Map<string, Partial<Log>[]>();

  logs.forEach((log) => {
    if (!log.created_at) return;
    const date = startOfHour(new Date(log.created_at));
    const dateKey = format(date, "yyyy-MM-dd-HH");
    if (!hourlyGroups.has(dateKey)) {
      hourlyGroups.set(dateKey, []);
    }
    hourlyGroups.get(dateKey)!.push(log);
  });

  return Array.from(hourlyGroups.entries())
    .map(([dateKey, hourLogs]) => {
      const latencies = hourLogs
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

  // If there's only one day or less than 24 hours of data, group by hour
  if (daysDifference === 0) {
    return groupLogsByHour(logs);
  }

  // Otherwise, group by day
  return groupLogsByDay(logs);
};

export default function LatencyLineChart({
  logs,
  height = 200,
}: LatencyLineChartProps) {
  const chartData = groupLogsByTime(logs);
  const isHourlyData = chartData.length > 0 && chartData[0].date.includes("-");

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
    avg: { label: "Average", color: "#4c82f7" },
    median: { label: "Median (p50)", color: "#22c55e" },
    p95: { label: "p95", color: "#f97316" },
    p99: { label: "p99", color: "#ef4444" },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="max-h-80 w-full"
      style={{ height }}
    >
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => {
            if (isHourlyData) {
              const parts = value.split("-");
              if (parts.length === 4) {
                const hour = parts[3];
                return `${hour}:00`;
              }
              return value;
            } else {
              return format(new Date(value), "MMM d");
            }
          }}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
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
                  if (isHourlyData) {
                    const parts = label.split("-");
                    if (parts.length === 4) {
                      const [year, month, day, hour] = parts;
                      const date = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                        parseInt(hour)
                      );
                      if (isNaN(date.getTime())) {
                        return label;
                      }
                      return format(date, "MMM d, yyyy - HH:00");
                    }
                    return label;
                  } else {
                    const date = new Date(label);
                    if (isNaN(date.getTime())) {
                      return label;
                    }
                    return format(date, "MMM d, yyyy");
                  }
                } catch (error) {
                  console.error("Error formatting date label:", error, label);
                  return label;
                }
              }}
            />
          }
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="var(--color-avg)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="median"
          stroke="var(--color-median)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p95"
          stroke="var(--color-p95)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p99"
          stroke="var(--color-p99)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
