import { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode, groupLogsByRegion } from "@/frontend/lib/utils";
import LatencyLineChart from "./latency-line-chart";

interface RegionLatencyChartsProps {
  logs: Partial<Log>[];
  height?: number;
}

export default function MonitorRegionLatencyCharts({
  logs,
  height,
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

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium">Latency Trends by Region</h2>

      <div className="w-full space-y-6">
        {Object.entries(groupedLogs).map(([region, regionLogs]) => {
          return (
            <div key={region} className="space-y-4">
              <h3 className="text-xs font-medium">
                {getRegionNameFromCode(region)}
              </h3>
              <LatencyLineChart logs={regionLogs} height={height} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
