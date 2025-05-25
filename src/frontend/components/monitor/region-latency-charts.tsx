import { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode, groupLogsByRegion } from "@/frontend/lib/utils";
import { subDays } from "date-fns";
import LatencyChart from "./latency-chart";

interface RegionLatencyChartsProps {
  logs: Partial<Log>[];
  height?: number;
  days: number;
}

export default function RegionLatencyCharts({
  logs,
  height = 36,
  days,
}: RegionLatencyChartsProps) {
  const filterDate = subDays(new Date(), days);
  const filteredLogs = logs.filter((log) => {
    if (!log.created_at) return false;
    const logDate = new Date(log.created_at);
    return logDate >= filterDate;
  });

  const groupedLogs = groupLogsByRegion(filteredLogs);

  if (Object.keys(groupedLogs).length === 0) {
    return (
      <div className="flex items-center justify-center w-full p-4">
        <p className="text-sm text-muted-foreground">
          No latency data available for the selected period
        </p>
      </div>
    );
  }

  const perRegionHeight = Math.max(
    height,
    Object.keys(groupedLogs).length > 0 ? 120 : height,
  );

  return (
    <div className="w-full space-y-6">
      {Object.entries(groupedLogs).map(([region, regionLogs]) => {
        const latencies = regionLogs.map((log) => log.latency || 0);
        const maxLatency = Math.max(...latencies);
        const minLatency = Math.min(...latencies);
        const avgLatency =
          regionLogs.length > 0
            ? Math.round(
                latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
              )
            : 0;

        return (
          <div key={region}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium">
                {getRegionNameFromCode(region)}
              </h3>
              <div className="text-xs text-slate-500 space-x-3">
                <span className="font-medium">Min: {minLatency}ms</span>
                <span className="font-medium">Avg: {avgLatency}ms</span>
                <span className="font-medium">Max: {maxLatency}ms</span>
              </div>
            </div>
            <LatencyChart logs={regionLogs} height={perRegionHeight} />
          </div>
        );
      })}
    </div>
  );
}
