import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/frontend/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode } from "@/frontend/lib/utils";
import { useMemo, useState } from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";

function getChartData(logs: Partial<Log>[], selectedRegion: string) {
  const regionLogs = logs.filter((log) => log.region === selectedRegion);
  const allTimestamps = Array.from(
    new Set(
      regionLogs
        .filter((log) => log.created_at && log.latency && log.latency > 0)
        .map((log) => {
          const d = new Date(log.created_at!);
          d.setMinutes(0, 0, 0);
          return d.toISOString();
        })
    )
  ).sort();

  const chartData = allTimestamps.map((date) => {
    const log = regionLogs.find((l) => {
      if (!l.created_at) return false;
      const d = new Date(l.created_at);
      d.setMinutes(0, 0, 0);
      return d.toISOString() === date;
    });
    return {
      date,
      latency: log && log.latency ? Math.round(log.latency) : null,
    };
  });

  return chartData;
}

function getStats(logs: Partial<Log>[], selectedRegion: string) {
  const regionLogs = logs.filter(
    (log) => log.region === selectedRegion && log.latency && log.latency > 0
  );
  if (regionLogs.length === 0) return { min: 0, max: 0, avg: 0 };

  const latencies = regionLogs.map((log) => log.latency!) as number[];
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const avg = Math.round(
    latencies.reduce((sum, val) => sum + val, 0) / latencies.length
  );

  return { min, max, avg };
}

export default function MonitorRegionLatencyCharts({
  logs,
}: {
  logs: Partial<Log>[];
}) {
  const availableRegions = useMemo(() => {
    const regions = Array.from(
      new Set(logs.map((log) => log.region).filter(Boolean))
    ) as string[];
    return regions.sort();
  }, [logs]);

  const [selectedRegion, setSelectedRegion] = useState<string>(
    availableRegions[0] || ""
  );
  const chartData = useMemo(
    () => getChartData(logs, selectedRegion),
    [logs, selectedRegion]
  );
  const stats = useMemo(
    () => getStats(logs, selectedRegion),
    [logs, selectedRegion]
  );

  if (availableRegions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Latency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground border border-dashed p-8 text-center text-sm">
            No latency data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    latency: {
      label: getRegionNameFromCode(selectedRegion),
      theme: {
        light: "#6B7280",
        dark: "#9CA3AF",
      },
    },
  };

  return (
    <Card>
      <CardHeader className="inline-flex w-full flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Latency by Region</CardTitle>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="px-1.5 py-1 text-xs">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {availableRegions.map((region) => (
              <SelectItem key={region} value={region} className="p-1.5 text-xs">
                {getRegionNameFromCode(region)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-80">
          <LineChart
            data={chartData}
            height={250}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickMargin={8}
              tickFormatter={(value) => {
                const d = new Date(value);
                const month = d.toLocaleString("default", { month: "short" });
                const day = d.getDate();
                const hour = d.getHours();
                const period = hour >= 12 ? "PM" : "AM";
                const hour12 = hour % 12 || 12;
                return `${month} ${day}, ${hour12}:00 ${period}`;
              }}
              minTickGap={50}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => {
                const rounded = Math.ceil(value / 100) * 100;
                return `${rounded}ms`;
              }}
              width={50}
              domain={["dataMin - 10", "dataMax + 10"]}
            />
            <ChartTooltip
              cursor={{
                stroke: "hsl(var(--border))",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value) => [
                getRegionNameFromCode(selectedRegion), 
                
                ` ${value}ms`,
              ]}
            />
            <Line
              dataKey="latency"
              type="monotone"
              stroke="var(--color-latency)"
              strokeWidth={1}
              dot={false}
              activeDot={{
                r: 4,
                fill: "var(--color-latency)",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
              connectNulls
              name={getRegionNameFromCode(selectedRegion)}
            />
          </LineChart>
        </ChartContainer>
        <div className="text-muted-foreground mt-3 flex justify-center gap-6 text-xs">
          <span>Min: {stats.min}ms</span>
          <span>Avg: {stats.avg}ms</span>
          <span>Max: {stats.max}ms</span>
        </div>
      </CardContent>
    </Card>
  );
}
