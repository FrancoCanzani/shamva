import { Button } from "@/frontend/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/frontend/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { useTheme } from "@/frontend/lib/context/theme-context";
import { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";

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

function calculateAverageLatency(
  chartData: ChartDataPoint[],
  isSplitRegions: boolean
): number {
  const validData = chartData
    .map((point) => {
      if (isSplitRegions) {
        return point.latency;
      } else {
        // For combined view, calculate average across all regions
        const values = Object.keys(point)
          .filter((key) => key.startsWith("latency_"))
          .map((key) => point[key])
          .filter((value) => value !== null && typeof value === "number");
        return values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null;
      }
    })
    .filter((value) => value !== null && typeof value === "number") as number[];

  return validData.length > 0
    ? validData.reduce((a, b) => a + b, 0) / validData.length
    : 0;
}

export default function MonitorRegionLatencyCharts({
  logs,
}: {
  logs: Partial<Log>[];
}) {
  const navigate = Route.useNavigate();
  const { splitRegions } = Route.useSearch();
  const { theme } = useTheme();

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

  const averageLatency = useMemo(
    () => calculateAverageLatency(chartData, isSplitRegions),
    [chartData, isSplitRegions]
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

  const averageLineColor = theme === "dark" ? "#ffffff" : "#000000";
  const averageTextColor = theme === "dark" ? "#ffffff" : "#000000";

  if (availableRegions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground rounded border border-dashed p-8 text-center text-sm">
          No latency data available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium">
            Average latency for{" "}
            <span className="inline-flex items-center gap-1">
              {isSplitRegions
                ? getRegionNameFromCode(selectedRegion)
                : availableRegions.length === 1
                  ? getRegionNameFromCode(availableRegions[0])
                  : "all regions"}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {availableRegions.length > 1 && (
            <Button variant="outline" size="xs" onClick={toggleSplitRegions}>
              {isSplitRegions ? "Combine Regions" : "Split Regions"}
            </Button>
          )}
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
      </div>

      <ChartContainer config={chartConfig} className="aspect-auto h-72">
        <LineChart data={chartData} height={320}>
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
            tickFormatter={(value) => format(new Date(value), "MMM d")}
            minTickGap={80}
            interval="equidistantPreserveStart"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              // Round the intervals
              if (value >= 1000) {
                return `${Math.round(value / 100) * 100}ms`;
              } else if (value >= 100) {
                return `${Math.round(value / 50) * 50}ms`;
              } else {
                return `${Math.round(value / 10) * 10}ms`;
              }
            }}
            width={50}
            domain={["dataMin - 5", "dataMax + 10"]}
            tickCount={6}
          />
          <ChartTooltip
            cursor={{
              stroke: "#e5e7eb",
              strokeWidth: 1,
              strokeDasharray: "2 2",
            }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;

              const timestamp = format(
                new Date(payload[0].payload.date),
                "MMM d, h:mm a"
              );

              return (
                <div className="bg-background rounded border p-1.5 text-xs shadow-xs">
                  <div className="mb-1 font-medium text-gray-900">
                    {timestamp}
                  </div>
                  <div className="text-muted-foreground">
                    {payload[0].value ? `${payload[0].value}ms` : "No data"}
                  </div>
                </div>
              );
            }}
          />
          {averageLatency > 0 && (
            <ReferenceArea
              y1={averageLatency - 10}
              y2={averageLatency + 10}
              fill={averageLineColor}
              fillOpacity={0.1}
              stroke={averageLineColor}
              strokeDasharray="3 3"
              strokeWidth={0.8}
              label={{
                value: `Avg: ${Math.round(averageLatency)}ms`,
                position: "insideTopRight",
                fill: averageTextColor,
                fontSize: 10,
                fontWeight: 500,
              }}
            />
          )}
          {isSplitRegions ? (
            <Line
              dataKey="latency"
              type="monotone"
              stroke={averageLineColor}
              strokeWidth={1.2}
              dot={false}
              activeDot={{
                r: 3,
                fill: averageLineColor,
                stroke: "#ffffff",
                strokeWidth: 1,
              }}
              connectNulls={false}
              name={getRegionNameFromCode(selectedRegion)}
            />
          ) : (
            availableRegions.map((region, index) => {
              const color =
                availableRegions.length === 1
                  ? averageLineColor
                  : [
                      "#6B7280",
                      "#EF4444",
                      "#10B981",
                      "#3B82F6",
                      "#8B5CF6",
                      "#F59E0B",
                    ][index % 6];

              return (
                <Line
                  key={region}
                  dataKey={`latency_${region}`}
                  type="monotone"
                  stroke={color}
                  strokeWidth={1.2}
                  dot={false}
                  activeDot={{
                    r: 3,
                    fill: color,
                    stroke: "#ffffff",
                    strokeWidth: 1,
                  }}
                  connectNulls={false}
                  name={getRegionNameFromCode(region)}
                />
              );
            })
          )}
          {!isSplitRegions && availableRegions.length > 1 && (
            <ChartLegend
              content={<ChartLegendContent />}
              verticalAlign="bottom"
              align="center"
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
