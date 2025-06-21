import type { Log } from "@/frontend/lib/types";
import { format, startOfDay } from "date-fns";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
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

export default function LatencyLineChart({
  logs,
  height = 200,
}: LatencyLineChartProps) {
  const dailyData = groupLogsByDay(logs);

  if (dailyData.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full p-4"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">
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
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      <LineChart
        data={dailyData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(new Date(value), "MMM d")}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={2}
          tickFormatter={(value) => `${value}ms`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
              formatter={(value, name) => [
                `${value}ms`,
                chartConfig[name as keyof typeof chartConfig].label,
              ]}
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