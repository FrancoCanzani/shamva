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
import { Metric } from "../types";

interface AreaChartFillByValueProps {
  title: string;
  metrics: Metric[];
  dataKey: keyof Metric;
  unit: string;
  selectedDays?: number;
}

interface ChartDataPoint {
  date: string;
  value: number;
  timestamp: string;
}

function getChartData(metrics: Metric[], dataKey: keyof Metric, selectedDays?: number): ChartDataPoint[] {
  // If we have double the data (for comparison), only show the recent half for charts
  let metricsToShow = metrics;
  if (selectedDays && metrics.length > 0) {
    // Sort by date and take the more recent half
    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const midPoint = Math.floor(sortedMetrics.length / 2);
    metricsToShow = sortedMetrics.slice(0, midPoint);
  }
  
  return metricsToShow
    .filter((metric) => metric[dataKey] !== undefined && metric[dataKey] !== null)
    .map((metric) => {
      let value = Number(metric[dataKey]);
      
      // Data validation
      if (dataKey.includes('percent') && value > 100) {
        value = 100;
      }
      if (dataKey.includes('percent') && value < 0) {
        value = 0;
      }
      if (dataKey === 'load_avg_1' && value < 0) {
        value = 0; // Load average cannot be negative
      }
      
      return {
        date: metric.created_at,
        value: value,
        timestamp: metric.created_at,
      };
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function calculateAverage(data: ChartDataPoint[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, point) => sum + point.value, 0) / data.length;
}

function getMetricTooltip(dataKey: string): string {
  switch (dataKey) {
    case 'cpu_percent':
      return 'CPU usage percentage. Normal: <50%, High: 50-80%, Critical: >80%';
    case 'memory_percent':
      return 'Memory usage percentage. Normal: <70%, High: 70-90%, Critical: >90%';
    case 'disk_percent':
      return 'Disk space usage percentage. Normal: <70%, High: 70-90%, Critical: >90%';
    case 'load_avg_1':
      return 'System load average - how many processes are waiting for CPU. 1.0 = fully utilized, 2.0 = overloaded (twice the work). Normal: <1.0, High: 1.0-2.0, Critical: >2.0';
    default:
      return 'System metric over time';
  }
}

function getThresholds(dataKey: keyof Metric): { yellow: number; red: number } {
  switch (dataKey) {
    case 'cpu_percent':
      return { yellow: 50, red: 80 };
    case 'memory_percent':
    case 'disk_percent':
      return { yellow: 70, red: 90 };
    case 'load_avg_1':
      return { yellow: 1, red: 2 };
    default:
      return { yellow: 50, red: 80 };
  }
}

function getGradientOffset(data: ChartDataPoint[], dataKey: keyof Metric): { yellowOffset: number; redOffset: number } {
  if (data.length === 0) return { yellowOffset: 0, redOffset: 0 };
  
  const thresholds = getThresholds(dataKey);
  const dataMax = Math.max(...data.map((i) => i.value));
  const dataMin = Math.min(...data.map((i) => i.value));
  
  if (dataMax <= thresholds.yellow) {
    return { yellowOffset: 0, redOffset: 0 }; // All green
  }
  
  if (dataMin >= thresholds.red) {
    return { yellowOffset: 1, redOffset: 1 }; // All red
  }
  
  if (dataMin >= thresholds.yellow) {
    // Between yellow and red
    const redOffset = dataMax <= thresholds.red ? 0 : 1 - (thresholds.red - dataMin) / (dataMax - dataMin);
    return { yellowOffset: 1, redOffset };
  }
  
  // Spans all three colors
  const yellowOffset = 1 - (thresholds.yellow - dataMin) / (dataMax - dataMin);
  const redOffset = dataMax <= thresholds.red ? 0 : 1 - (thresholds.red - dataMin) / (dataMax - dataMin);
  
  return { yellowOffset, redOffset };
}

export default function AreaChartFillByValue({
  title,
  metrics,
  dataKey,
  unit,
  selectedDays,
}: AreaChartFillByValueProps) {

  const chartData = getChartData(metrics, dataKey, selectedDays);
  const average = calculateAverage(chartData);
  const tooltipText = getMetricTooltip(dataKey as string);

  // Calculate gradient offsets for dynamic coloring
  const { yellowOffset, redOffset } = getGradientOffset(chartData, dataKey);
  const gradientId = `splitColor-${dataKey}`;

  const chartConfig: ChartConfig = {
    value: {
      label: title,
      color: "#10b981", // Default to green
    },
  };

  if (chartData.length === 0) {
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
        </div>
        <div className="text-muted-foreground flex h-28 items-center justify-center text-xs rounded border border-dashed">
          No data available for this metric
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
          Avg: {average.toFixed(1)}{unit}
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-28 w-full">
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 30, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-error)" stopOpacity={0.8} />
              <stop offset={redOffset} stopColor="var(--color-error)" stopOpacity={0.8} />
              <stop offset={redOffset} stopColor="var(--color-degraded)" stopOpacity={0.8} />
              <stop offset={yellowOffset} stopColor="var(--color-degraded)" stopOpacity={0.8} />
              <stop offset={yellowOffset} stopColor="var(--color-ok)" stopOpacity={0.8} />
              <stop offset="1" stopColor="var(--color-ok)" stopOpacity={0.8} />
            </linearGradient>
          </defs>
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
              dataKey.toString().includes('percent') 
                ? [0, 100] 
                : dataKey === 'load_avg_1'
                ? [0, "dataMax + 0.5"]
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
              const timestamp = format(new Date(data.timestamp), "MMM d, h:mm a");

              return (
                <div className="bg-background rounded border p-1.5 text-xs shadow-xs">
                  <div className="mb-1 font-medium text-gray-900">
                    {timestamp}
                  </div>
                  <div className="text-muted-foreground">
                    {data.value.toFixed(1)}{unit}
                  </div>
                </div>
              );
            }}
          />
          <Area
            dataKey="value"
            type="monotone"
            stroke="#000000"
            strokeWidth={1.2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 3,
              fill: "#10b981",
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
