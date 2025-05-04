import { Log } from "@/frontend/lib/types";
import { getRegionNameFromCode, groupLogsByRegion } from "@/frontend/lib/utils";
import LatencyChart from "./latency-chart";

export default function RegionLatencyCharts({
  logs,
  height = 36,
}: {
  logs: Partial<Log>[];
  height?: number;
}) {
  const groupedLogs = groupLogsByRegion(logs);

  if (Object.keys(groupedLogs).length === 0) {
    return (
      <div className="flex items-center justify-center w-full bg-slate-50 dark:bg-slate-800/50 rounded-md p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No latency data available
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

        return (
          <div key={region}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium">
                {getRegionNameFromCode(region)}
              </h3>
              <div className="text-xs text-slate-500 space-x-3">
                <span className="font-medium">Min: {minLatency}ms</span>
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
