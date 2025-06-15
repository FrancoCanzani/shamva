import type { Log } from "@/frontend/lib/types";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

interface LatencyChartProps {
  logs: Partial<Log>[];
  height?: number;
}

const getStatusColorValue = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "#9ca3af"; // gray-400
  }
  if (status >= 200 && status < 300) {
    return "#10b981"; // green-500
  } else if (status >= 300 && status < 400) {
    return "#3b82f6"; // blue-500
  } else if (status >= 400 && status < 500) {
    return "#f59e0b"; // amber-500
  } else if (status >= 500 || status < 0) {
    return "#ef4444"; // red-500
  }
  return "#9ca3af"; // gray-400
};

export default function LatencyChart({
  logs,
  height = 100,
}: LatencyChartProps) {
  if (!logs.length) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-sm text-muted-foreground">
          No latency data available
        </p>
      </div>
    );
  }

  const chartData = logs.map((log, index) => ({
    index,
    latency: log.latency || 0,
    status: log.status_code,
    date: log.created_at ? new Date(log.created_at) : new Date(),
  }));

  const avgLatency =
    chartData.reduce((sum, item) => sum + item.latency, 0) / chartData.length;

  const chartConfig = {
    latency: {
      label: "Latency",
      color: "#3b82f6",
    },
    avgLatency: {
      label: "Avg Latency",
      color: "#ef4444",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: height }}
    >
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="index" tick={false} tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={2}
          tickFormatter={(value) => `${value}ms`}
          width={50}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              className="rounded"
              labelFormatter={(_, payload) => {
                if (!payload || !payload.length) return "";
                const item = payload[0];
                if (!item?.payload?.date) return "";

                try {
                  return format(item.payload.date, "MMM d, HH:mm:ss");
                } catch {
                  return "";
                }
              }}
              formatter={(value) => [`${value}ms`, " latency"]}
            />
          }
        />
        <Bar dataKey="latency" radius={[0, 0, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getStatusColorValue(entry.status)}
            />
          ))}
        </Bar>
        <ReferenceLine y={avgLatency} stroke="#62748e" strokeDasharray="3 3" />
      </BarChart>
    </ChartContainer>
  );
}
