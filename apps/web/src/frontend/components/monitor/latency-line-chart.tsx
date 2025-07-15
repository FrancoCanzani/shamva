import type { Log } from "@/frontend/lib/types";
import { format } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

interface LatencyLineChartProps {
  logs: Partial<Log>[];
  height?: number;
}

const regionColors = [
  "#065f46", // dark green
  "#1e3a8a", // dark blue
  "#92400e", // dark yellow/brown
  "#991b1b", // dark red
  "#581c87", // dark purple
  "#0e7490", // dark cyan
  "#b45309", // dark amber
  "#3730a3", // dark indigo
  "#be185d", // dark pink
];

type ChartDatum = {
  date: string;
  [region: string]: number | string | null;
};

type LegendPayloadItem = {
  value: string;
  type: "line";
  color: string;
  id: string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload?.length || !label) return null;
  const date = new Date(label);
  return (
    <div className="bg-background rounded border p-1.5 shadow-xs">
      <p className="text-xs font-medium">{format(date, "MMM d, yyyy HH:mm")}</p>
      {payload.map((entry, idx) => (
        <p
          key={idx}
          className="text-muted-foreground text-xs"
          style={{ color: entry.color }}
        >
          {entry.dataKey}: {entry.value}ms
        </p>
      ))}
    </div>
  );
};

export default function LatencyLineChart({
  logs,
  height = 400,
}: LatencyLineChartProps) {
  const logsByRegion: Record<string, Partial<Log>[]> = {};

  logs.forEach((log) => {
    if (!log.region) return;
    if (!logsByRegion[log.region]) logsByRegion[log.region] = [];
    logsByRegion[log.region].push(log);
  });

  const regionKeys = Object.keys(logsByRegion);

  const allTimestamps = Array.from(
    new Set(
      logs
        .filter((log) => log.created_at && log.latency && log.latency > 0)
        .map((log) => {
          const d = new Date(log.created_at!);
          d.setMinutes(0, 0, 0);
          return d.toISOString();
        })
    )
  ).sort();

  const chartData: ChartDatum[] = allTimestamps.map((date) => {
    const entry: ChartDatum = { date };
    regionKeys.forEach((region) => {
      const log = logsByRegion[region].find((l) => {
        if (!l.created_at) return false;
        const d = new Date(l.created_at);
        d.setMinutes(0, 0, 0);
        return d.toISOString() === date;
      });
      entry[region] = log && log.latency ? Math.round(log.latency) : null;
    });
    return entry;
  });

  if (chartData.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center p-4"
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">
          No latency data available
        </p>
      </div>
    );
  }

  let displayRegionKeys = regionKeys;
  let showOther = false;
  if (regionKeys.length > 5) {
    displayRegionKeys = regionKeys.slice(0, 5);
    showOther = true;
  }
  const legendPayload: LegendPayloadItem[] = displayRegionKeys.map(
    (region, idx) => ({
      value: region,
      type: "line",
      color: regionColors[idx % regionColors.length],
      id: region,
    })
  );
  if (showOther) {
    legendPayload.push({
      value: "Other",
      type: "line",
      color: "#6b7280",
      id: "Other",
    });
  }

  return (
    <div className="w-full text-xs" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ left: 0, right: 20, top: 10, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="1 1"
            stroke="#374151"
            opacity={0.05}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), "MMM d HH:00")}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            align="center"
            verticalAlign="bottom"
            formatter={(value, _entry, index) => {
              if (showOther && index === 5) return "Other";
              return value as string;
            }}
            payload={legendPayload}
          />
          {displayRegionKeys.map((region, idx) => (
            <Line
              key={region}
              type="monotone"
              dataKey={region}
              name={region}
              stroke={regionColors[idx % regionColors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: regionColors[idx % regionColors.length],
              }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
