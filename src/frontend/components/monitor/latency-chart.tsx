import { Log } from "@/frontend/lib/types";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

interface LatencyChartProps {
  logs: Partial<Log>[];
  height?: number;
}

export default function LatencyChart({
  logs,
  height = 100,
}: LatencyChartProps) {
  if (!logs.length) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800/50 rounded-md p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No latency data available
        </p>
      </div>
    );
  }

  // Keep track of original log date for tooltip
  const chartData = logs.map((log, index) => ({
    index,
    latency: log.latency || 0,
    date: log.created_at ? new Date(log.created_at) : new Date(),
  }));

  const chartConfig = {
    latency: {
      label: "Latency",
      color: "#3b82f6",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: height }}
    >
      <LineChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="index" tick={false} tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
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
              formatter={(value) => [`${value}ms`, "latency"]}
            />
          }
        />
        <Line
          dataKey="latency"
          type="monotone"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
