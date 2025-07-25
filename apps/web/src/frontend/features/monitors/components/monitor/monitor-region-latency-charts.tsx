import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/frontend/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Log } from "@/frontend/types/types";
import { getRegionNameFromCode } from "@/frontend/utils/utils";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";

type ChartDataPoint = {
  date: string;
  [key: string]: string | number | null;
};

type ChartConfig = {
  [key: string]: {
    label: string;
    theme: {
      light: string;
      dark: string;
    };
  };
};

function getChartData(
  logs: Partial<Log>[],
  selectedRegion: string | null,
  availableRegions: string[]
): ChartDataPoint[] {
  // Get the date range from the logs
  const validLogs = logs.filter(
    (log) => log.created_at && log.latency && log.latency > 0
  );

  if (validLogs.length === 0) return [];

  const timestamps = validLogs.map((log) => new Date(log.created_at!));
  const minDate = new Date(Math.min(...timestamps.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...timestamps.map((d) => d.getTime())));

  // Round to the nearest hour
  minDate.setMinutes(0, 0, 0);
  maxDate.setMinutes(0, 0, 0);

  // Generate hourly timestamps
  const allTimestamps: string[] = [];
  const currentDate = new Date(minDate);

  while (currentDate <= maxDate) {
    allTimestamps.push(currentDate.toISOString());
    currentDate.setHours(currentDate.getHours() + 1);
  }

  return allTimestamps.map((date) => {
    const dataPoint: ChartDataPoint = { date };

    if (selectedRegion) {
      const regionLogs = logs.filter((log) => log.region === selectedRegion);
      const log = regionLogs.find((l) => {
        if (!l.created_at) return false;
        const d = new Date(l.created_at);
        d.setMinutes(0, 0, 0);
        return d.toISOString() === date;
      });
      dataPoint.latency = log?.latency ? Math.round(log.latency) : null;
    } else {
      availableRegions.forEach((region) => {
        const regionLogs = logs.filter((log) => log.region === region);
        const log = regionLogs.find((l) => {
          if (!l.created_at) return false;
          const d = new Date(l.created_at);
          d.setMinutes(0, 0, 0);
          return d.toISOString() === date;
        });
        dataPoint[`latency_${region}`] = log?.latency
          ? Math.round(log.latency)
          : null;
      });
    }

    return dataPoint;
  });
}

function getStats(logs: Partial<Log>[], selectedRegion: string | null) {
  const regionLogs = selectedRegion
    ? logs.filter(
        (log) => log.region === selectedRegion && log.latency && log.latency > 0
      )
    : logs.filter((log) => log.latency && log.latency > 0);

  if (regionLogs.length === 0) return { min: 0, max: 0, avg: 0 };

  const latencies = regionLogs.map((log) => log.latency!);
  const min = Math.round(Math.min(...latencies));
  const max = Math.round(Math.max(...latencies));
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
  const navigate = Route.useNavigate();
  const { splitRegions } = Route.useSearch();

  const isSplitRegions = splitRegions ?? false;

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
    () =>
      getChartData(
        logs,
        isSplitRegions ? selectedRegion : null,
        availableRegions
      ),
    [logs, isSplitRegions, selectedRegion, availableRegions]
  );

  const stats = useMemo(
    () => getStats(logs, isSplitRegions ? selectedRegion : null),
    [logs, isSplitRegions, selectedRegion]
  );

  const chartConfig = useMemo((): ChartConfig => {
    const colors = [
      { light: "#6B7280", dark: "#9CA3AF" },
      { light: "#EF4444", dark: "#F87171" },
      { light: "#10B981", dark: "#34D399" },
      { light: "#3B82F6", dark: "#60A5FA" },
      { light: "#8B5CF6", dark: "#A78BFA" },
      { light: "#F59E0B", dark: "#FBBF24" },
    ];

    if (isSplitRegions) {
      return {
        latency: {
          label: getRegionNameFromCode(selectedRegion),
          theme: colors[0],
        },
      };
    }

    const config: ChartConfig = {};
    availableRegions.forEach((region, index) => {
      config[`latency_${region}`] = {
        label: getRegionNameFromCode(region),
        theme: colors[index % colors.length],
      };
    });
    return config;
  }, [isSplitRegions, selectedRegion, availableRegions]);

  const toggleSplitRegions = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        splitRegions: !isSplitRegions,
      }),
      replace: true,
    });
  };

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

  return (
    <Card>
      <CardHeader className="inline-flex w-full flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Latency by Region</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={toggleSplitRegions}>
            {isSplitRegions ? "Combine Regions" : "Split Regions"}
          </Button>
          {isSplitRegions && (
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="max-h-7 px-1.5 py-1 text-xs">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((region) => (
                  <SelectItem
                    key={region}
                    value={region}
                    className="p-1.5 text-xs"
                  >
                    {getRegionNameFromCode(region)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-80 px-1">
          <LineChart
            data={chartData}
            height={250}
            margin={{ top: 5, right: 25, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={15}
              className="font-mono tracking-tighter"
              tickFormatter={(value) => format(new Date(value), "MMM d")}
              minTickGap={70}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="font-mono"
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
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                const timestamp = format(
                  new Date(payload[0].payload.date),
                  "MMM d, h:mm a"
                );

                return (
                  <div className="bg-background rounded border p-2 shadow-sm">
                    <div className="text-xs font-medium">{timestamp}</div>
                    {payload.map((entry, index) => {
                      const regionName = isSplitRegions
                        ? getRegionNameFromCode(selectedRegion)
                        : getRegionNameFromCode(
                            typeof entry.dataKey === "string"
                              ? entry.dataKey.replace("latency_", "")
                              : ""
                          );
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="h-2 w-2 rounded-xs"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span>{regionName}</span>
                          <span className="text-muted-foreground">
                            {entry.value}ms
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            {isSplitRegions ? (
              <Line
                dataKey="latency"
                type="monotone"
                stroke="var(--color-latency)"
                strokeWidth={1.5}
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
            ) : (
              availableRegions.map((region) => (
                <Line
                  key={region}
                  dataKey={`latency_${region}`}
                  type="monotone"
                  stroke={`var(--color-latency_${region})`}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: `var(--color-latency_${region})`,
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                  connectNulls
                  name={getRegionNameFromCode(region)}
                />
              ))
            )}
          </LineChart>
        </ChartContainer>
        <div className="text-muted-foreground mt-3 flex justify-center gap-6 font-mono text-xs">
          <span>Min: {stats.min}ms</span>
          <span>Avg: {stats.avg}ms</span>
          <span>Max: {stats.max}ms</span>
        </div>
      </CardContent>
    </Card>
  );
}
