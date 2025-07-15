import { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode } from "@/frontend/lib/utils";
import LatencyLineChart from "./latency-line-chart";

interface RegionLatencyChartsProps {
  logs: Partial<Log>[];
  height?: number;
  region?: string;
}

export default function MonitorRegionLatencyCharts({
  logs,
  height,
  region,
}: RegionLatencyChartsProps) {
  let displayLogs = logs;
  let regionLabel: string | undefined = undefined;
  if (region) {
    displayLogs = logs.filter((log) => log.region === region);
    regionLabel = getRegionNameFromCode(region);
  }

  if (displayLogs.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-sm font-medium">Latency Trends by Region</h2>
        <div className="border border-dashed p-8">
          <p className="text-muted-foreground text-center text-sm">
            No latency data available for the selected period
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium">Latency Trends by Region</h2>
      {regionLabel && (
        <h3 className="mb-2 text-xs font-medium">{regionLabel}</h3>
      )}
      <LatencyLineChart logs={displayLogs} height={height} />
    </div>
  );
}
