import { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode, groupLogsByRegion } from "@/frontend/lib/utils";
import LatencyLineChart from "./latency-line-chart";

interface RegionLatencyChartsProps {
  logs: Partial<Log>[];
  height?: number;
}

export default function MonitorRegionLatencyCharts({
  logs,
  height = 80,
}: RegionLatencyChartsProps) {
  const groupedLogs = groupLogsByRegion(logs);

  if (Object.keys(groupedLogs).length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-sm font-medium">Latency Trends by Region</h2>
        <div className="border border-dashed p-8">
          <p className="text-muted-foreground text-center text-sm">
            No latency data available for the selected period{" "}
          </p>
        </div>
      </div>
    );
  }

  const perRegionHeight = height - 40;

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium">Latency Trends by Region</h2>

      <div className="w-full space-y-6">
        {Object.entries(groupedLogs).map(([region, regionLogs]) => {
          const latencies = regionLogs.map((log) => log.latency || 0);
          const maxLatency = Math.max(...latencies, 0);
          const minLatency =
            latencies.length > 0
              ? Math.min(...latencies.filter((l) => l > 0))
              : 0;
          const avgLatency =
            regionLogs.length > 0
              ? Math.round(
                  latencies.reduce((sum, lat) => sum + lat, 0) /
                    latencies.length
                )
              : 0;

          return (
            <div key={region}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-medium">
                  {getRegionNameFromCode(region)}
                </h3>
                <div className="text-muted-foreground font-medium space-x-3 text-xs">
                  <span>Min: {minLatency}ms</span>
                  <span>Avg: {avgLatency}ms</span>
                  <span>Max: {maxLatency}ms</span>
                </div>
              </div>
              <LatencyLineChart logs={regionLogs} height={perRegionHeight} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
