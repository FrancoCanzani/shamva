import type { Log } from "@/frontend/lib/types";
import { format } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface LatencyMiniChartProps {
  logs: Partial<Log>[];
  height?: number;
  width?: number;
}

const groupLogsByTime = (logs: Partial<Log>[]) => {
  if (logs.length === 0) return [];

  const dates = logs
    .map((log) => log.created_at)
    .filter((date): date is string => !!date)
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return [];

  const fiveMinGroups = new Map<string, Partial<Log>[]>();

  logs.forEach((log) => {
    if (!log.created_at) return;
    const date = new Date(log.created_at);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / 5) * 5;
    const roundedDate = new Date(date);
    roundedDate.setMinutes(roundedMinutes, 0, 0);

    const dateKey = format(roundedDate, "yyyy-MM-dd-HH-mm");
    if (!fiveMinGroups.has(dateKey)) {
      fiveMinGroups.set(dateKey, []);
    }
    fiveMinGroups.get(dateKey)!.push(log);
  });

  return Array.from(fiveMinGroups.entries())
    .map(([dateKey, fiveMinLogs]) => {
      const latencies = fiveMinLogs
        .map((log) => log.latency || 0)
        .filter((l) => l > 0);
      if (latencies.length === 0) return null;

      const avg = Math.round(
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      );

      return { date: dateKey, avg };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default function LatencyMiniChart({
  logs,
  height = 40,
}: LatencyMiniChartProps) {
  const chartData = groupLogsByTime(logs);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#87CEEB" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#87CEEB" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis hide dataKey="date" />
          <YAxis hide />
          <Area
            type="monotone"
            dataKey="avg"
            stroke="#87CEEB"
            fill="url(#latencyGradient)"
            strokeWidth={1}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
