import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/frontend/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Metric } from "../../types";

interface CollectorMetricChartProps {
  title: string;
  metrics: Metric[];
  dataKey: keyof Metric;
  unit: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  timestamp: string;
}

function getChartData(
  metrics: Metric[],
  dataKey: keyof Metric
): ChartDataPoint[] {
  return metrics
    .filter(
      (metric) => metric[dataKey] !== undefined && metric[dataKey] !== null
    )
    .map((metric) => {
      let value = Number(metric[dataKey]);
      if (dataKey.includes("percent") && value > 100) {
        value = 100;
      }
      return {
        date: metric.created_at,
        value: value,
        timestamp: metric.created_at,
      };
    })
    .reverse();
}

function calculateAverage(data: ChartDataPoint[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, point) => sum + point.value, 0) / data.length;
}

function getMetricColor(dataKey: keyof Metric, average: number): string {
  if (dataKey === "cpu_percent") {
    if (average <= 50) return "#10b981";
    if (average <= 80) return "#f59e0b";
    return "#ef4444";
  }

  if (dataKey === "memory_percent" || dataKey === "disk_percent") {
    if (average <= 70) return "#10b981";
    if (average <= 90) return "#f59e0b";
    return "#ef4444";
  }

  if (dataKey === "load_avg_1") {
    if (average <= 1) return "#10b981";
    if (average <= 2) return "#f59e0b";
    return "#ef4444";
  }

  return "#6b7280";
}

function getMetricTooltip(dataKey: string): string {
  switch (dataKey) {
    case "cpu_percent":
      return "CPU usage percentage. Normal: <50%, High: 50-80%, Critical: >80%";
    case "memory_percent":
      return "Memory usage percentage. Normal: <70%, High: 70-90%, Critical: >90%";
    case "disk_percent":
      return "Disk space usage percentage. Normal: <70%, High: 70-90%, Critical: >90%";
    case "load_avg_1":
      return "System load average (1 minute). Normal: <1.0, High: 1.0-2.0, Critical: >2.0";
    default:
      return "System metric over time";
  }
}

export default function CollectorMetricChart({
  title,
  metrics,
  dataKey,
  unit,
}: CollectorMetricChartProps) {
  const chartData = getChartData(metrics, dataKey);
  const average = calculateAverage(chartData);
  const color = getMetricColor(dataKey, average);
  const tooltipText = getMetricTooltip(dataKey as string);

  const chartConfig: ChartConfig = {
    value: {
      label: title,
      color: color,
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger>
            <h3 className="text-sm font-medium underline decoration-dotted underline-offset-1 hover:text-blue-600 dark:hover:text-blue-400">
              {title}
            </h3>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
        <div className="text-muted-foreground text-xs">
          Avg: {average.toFixed(1)}
          {unit}
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-28 w-full">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 0, left: 30, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            opacity={1}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={30}
            interval="equidistantPreserveStart"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => format(new Date(value), "MMM d, HH:mm")}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${Math.round(value)}${unit}`}
            domain={
              dataKey.toString().includes("percent")
                ? [0, 100]
                : ["dataMin - 5", "dataMax + 5"]
            }
            width={40}
          />
          <ChartTooltip
            cursor={{
              stroke: "#e5e7eb",
              strokeWidth: 1,
              strokeDasharray: "2 2",
            }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;

              const data = payload[0].payload;
              const timestamp = format(
                new Date(data.timestamp),
                "MMM d, h:mm a"
              );

              return (
                <div className="bg-background rounded border p-1.5 text-xs shadow-xs">
                  <div className="mb-1 font-medium text-gray-900">
                    {timestamp}
                  </div>
                  <div className="text-muted-foreground">
                    {data.value.toFixed(1)}
                    {unit}
                  </div>
                </div>
              );
            }}
          />
          <Area
            dataKey="value"
            type="monotone"
            stroke={color}
            strokeWidth={1.2}
            fill={color}
            fillOpacity={0.1}
            dot={false}
            activeDot={{
              r: 3,
              fill: color,
              stroke: "#ffffff",
              strokeWidth: 1,
            }}
            connectNulls={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
