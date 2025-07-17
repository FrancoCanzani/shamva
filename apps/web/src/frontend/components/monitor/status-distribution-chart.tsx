import type { Log, Monitor } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { format } from "date-fns";
import { Bar, BarChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "../ui/chart";

interface StatusDistributionChartProps {
  logs: Partial<Log>[];
  monitor: Monitor;
}

type ChartSlot = {
  time: string;
  success: number;
  error: number;
  degraded: number;
  timestamp: number;
  successPercentage: number;
  errorPercentage: number;
  degradedPercentage: number;
};

export default function StatusDistributionChart({
  logs,
  monitor,
}: StatusDistributionChartProps) {
  const { days } = Route.useSearch();

  const getTimeConfig = (days: number, monitorInterval: number) => {
    let bucketSize: number;
    let buckets: number;
    let formatString: string;
    if (days === 1) {
      // 24h: 24 buckets, 1-hour intervals
      bucketSize = 60 * 60 * 1000;
      buckets = 24;
      formatString = "HH:mm";
    } else if (days === 7) {
      // 7d: 7 buckets, 1-day intervals
      bucketSize = 24 * 60 * 60 * 1000;
      buckets = 7;
      formatString = "MMM dd";
    } else {
      // 14d: 14 buckets, 1-day intervals
      bucketSize = 24 * 60 * 60 * 1000;
      buckets = 14;
      formatString = "MMM dd";
    }
    return {
      buckets,
      bucketSize,
      formatString,
      monitorInterval,
      expectedChecksPerBucket: Math.max(
        1,
        Math.floor(bucketSize / monitorInterval)
      ),
    };
  };

  const generateChartData = (inputLogs: Partial<Log>[]) => {
    if (inputLogs.length === 0) return [];
    const config = getTimeConfig(days || 1, monitor.interval);
    const now = new Date();
    const end = new Date(
      Math.floor(now.getTime() / config.bucketSize) * config.bucketSize
    );
    const start = new Date(end.getTime() - config.buckets * config.bucketSize);
    const slots: ChartSlot[] = [];
    for (let i = 0; i < config.buckets; i++) {
      const slotStart = new Date(start.getTime() + i * config.bucketSize);
      slots.push({
        time: format(slotStart, config.formatString),
        success: 0,
        error: 0,
        degraded: 0,
        timestamp: slotStart.getTime(),
        successPercentage: 0,
        errorPercentage: 0,
        degradedPercentage: 0,
      });
    }
    inputLogs.forEach((log) => {
      if (!log.created_at) return;
      const logTime = new Date(log.created_at).getTime();
      if (logTime < start.getTime() || logTime >= end.getTime()) return;
      const slotIndex = Math.floor(
        (logTime - start.getTime()) / config.bucketSize
      );
      if (slotIndex >= 0 && slotIndex < config.buckets) {
        const slot = slots[slotIndex];
        if (typeof log.ok === "boolean") {
          if (log.ok) {
            slot.success++;
          } else {
            slot.error++;
          }
        } else {
          slot.degraded++;
        }
      }
    });
    slots.forEach((slot) => {
      const total = slot.success + slot.error + slot.degraded;
      if (total > 0) {
        slot.successPercentage = (slot.success / total) * 100;
        slot.errorPercentage = (slot.error / total) * 100;
        slot.degradedPercentage = (slot.degraded / total) * 100;
      } else {
        slot.successPercentage = 0;
        slot.errorPercentage = 0;
        slot.degradedPercentage = 0;
      }
    });
    return slots;
  };

  const chartConfig = {
    successPercentage: {
      label: "Success",
      color: "#166534",
    },
    errorPercentage: {
      label: "Error",
      color: "#991b1b",
    },
    degradedPercentage: {
      label: "Degraded",
      color: "#facc15",
    },
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { payload: ChartSlot }[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded border bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm font-medium">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded bg-green-800"></div>
                <span className="text-xs">Success</span>
              </div>
              <span className="text-xs font-medium">
                {data.success} ({data.successPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded bg-red-800"></div>
                <span className="text-xs">Error</span>
              </div>
              <span className="text-xs font-medium">
                {data.error} ({data.errorPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded bg-yellow-400"></div>
                <span className="text-xs">Degraded</span>
              </div>
              <span className="text-xs font-medium">
                {data.degraded} ({data.degradedPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = (chartLogs: Partial<Log>[], regionLabel?: string) => {
    const chartData = generateChartData(chartLogs);
    if (chartData.length === 0) {
      return (
        <div className="space-y-4">
          {regionLabel && (
            <h4 className="text-muted-foreground text-sm font-medium">
              {regionLabel}
            </h4>
          )}
          <div className="rounded border border-dashed p-8">
            <p className="text-muted-foreground text-center text-sm">
              No data available
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2 rounded border px-3 pt-3 shadow-xs">
        <h3 className="text-sm font-medium">Uptime</h3>

        <ChartContainer config={chartConfig} className="h-[70px] w-full">
          <BarChart data={chartData}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748b" }}
              interval={3}
            />
            <ChartTooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
            />
            <Bar
              dataKey="successPercentage"
              fill="var(--color-successPercentage)"
              stackId="status"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="errorPercentage"
              fill="var(--color-errorPercentage)"
              stackId="status"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="degradedPercentage"
              fill="var(--color-degradedPercentage)"
              stackId="status"
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    );
  };
  return renderChart(logs);
}
