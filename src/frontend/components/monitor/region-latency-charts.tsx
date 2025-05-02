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
      <div className="flex items-center justify-center w-full bg-gray-50 dark:bg-gray-800/50 rounded-md p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
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
      {Object.entries(groupedLogs).map(([region, regionLogs]) => (
        <div key={region}>
          <h3 className="text-xs font-medium mb-2 flex items-center">
            {getRegionNameFromCode(region)}
          </h3>
          <LatencyChart logs={regionLogs} height={perRegionHeight} />
        </div>
      ))}
    </div>
  );
}
