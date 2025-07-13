import type { Log } from "@/frontend/lib/types";
import { format } from "date-fns";
import {
  CartesianGrid,
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


interface CustomTooltipProps extends TooltipProps<number, string> {
  dateFormat: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  dateFormat,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  const date = new Date(label as string);
  const displayFormat =
    dateFormat === "HH:mm" ? "MMM d, yyyy HH:mm" : dateFormat;

  return (
    <div className="bg-background rounded border p-1.5 shadow-xs">
      <p className="text-xs font-medium">{format(date, displayFormat)}</p>
      <p
        className="text-muted-foreground text-xs"
        style={{ color: payload[0].color }}
      >
        Latency: {payload[0].value}ms
      </p>
    </div>
  );
};

export default function LatencyLineChart({
  logs,
  height = 400,
}: LatencyLineChartProps) {
  // Present all data points directly, no grouping
  const data = logs
    .filter((log) => log.created_at && log.latency && log.latency > 0)
    .map((log) => {
      const d = new Date(log.created_at!);
      d.setMinutes(0, 0, 0); // round to nearest hour
      return {
        date: d.toISOString(),
        latency: Math.round(log.latency!),
        timestamp: d.getTime(),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  if (data.length === 0) {
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

  return (
    <div className="w-full text-xs" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data}
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
            dy={20}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}ms`}
            dx={-14}
          />
         <Tooltip content={<CustomTooltip dateFormat={"MMM d HH:mm"} />} />
          <Line
            type="monotone"
            dataKey="latency"
            stroke="black"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "black" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
