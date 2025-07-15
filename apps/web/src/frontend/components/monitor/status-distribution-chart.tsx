import type { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode, groupLogsByRegion } from "@/frontend/lib/utils";
import { format } from "date-fns";
import { Bar, BarChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

interface StatusDistributionChartProps {
  logs: Partial<Log>[];
  regionMode?: "combined" | "split";
}

export default function StatusDistributionChart({
  logs,
  regionMode = "combined",
}: StatusDistributionChartProps) {
  const generateChartData = (inputLogs: Partial<Log>[]) => {
    if (inputLogs.length === 0) return [];

    // Create 24 time slots for the last 24 hours
    const now = new Date();
    const slots = [];

    for (let i = 23; i >= 0; i--) {
      const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      slots.push({
        time: format(slotTime, "HH:mm"),
        success: 0,
        error: 0,
        degraded: 0,
        timestamp: slotTime.getTime(),
      });
    }

    // Distribute logs into time slots
    inputLogs.forEach((log) => {
      if (!log.created_at) return;

      const logTime = new Date(log.created_at).getTime();
      const slotIndex = Math.floor(
        (now.getTime() - logTime) / (60 * 60 * 1000)
      );

      if (slotIndex >= 0 && slotIndex < 24) {
        const slot = slots[23 - slotIndex];
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

    return slots;
  };

  const chartConfig = {
    success: {
      label: "Success",
      color: "#10b981",
    },
    error: {
      label: "Error",
      color: "#ef4444",
    },
    degraded: {
      label: "Degraded",
      color: "#f59e0b",
    },
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
      <div className="space-y-4">
        {regionLabel && (
          <h4 className="text-muted-foreground text-sm font-medium">
            {regionLabel}
          </h4>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uptime</h3>
          <p className="text-muted-foreground text-xs">
            Status across all regions
          </p>
        </div>

        <ChartContainer config={chartConfig} className="h-[120px]">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
          >
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748b" }}
              interval="preserveStartEnd"
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
            />
            <Bar
              dataKey="success"
              fill="var(--color-success)"
              stackId="status"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="error"
              fill="var(--color-error)"
              stackId="status"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="degraded"
              fill="var(--color-degraded)"
              stackId="status"
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ChartContainer>

        {/* Simple legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-[#10b981]"></div>
            <span className="text-muted-foreground">Success</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-[#ef4444]"></div>
            <span className="text-muted-foreground">Error</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-[#f59e0b]"></div>
            <span className="text-muted-foreground">Degraded</span>
          </div>
        </div>
      </div>
    );
  };

  if (regionMode === "split") {
    const grouped = groupLogsByRegion(logs) as Record<string, Partial<Log>[]>;
    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([region, regionLogs]) =>
          renderChart(
            regionLogs as Partial<Log>[],
            getRegionNameFromCode(region)
          )
        )}
      </div>
    );
  }

  return renderChart(logs);
}
