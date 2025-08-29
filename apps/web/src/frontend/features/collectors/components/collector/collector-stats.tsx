import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Metric } from "../../types";
import {
  calculatePrevPeriodAverage,
  getCurrentPeriodAverage,
} from "../../utils";

export default function CollectorStats({ metrics }: { metrics: Metric[] }) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const lastMetric = metrics[0];
  const currentCPU = lastMetric.cpu_percent;
  const currentMemory = lastMetric.memory_percent;
  const currentDisk = lastMetric.disk_percent;
  const currentLoad = lastMetric.load_avg_1;

  const avgCPU = getCurrentPeriodAverage(metrics, "cpu_percent");
  const avgMemory = getCurrentPeriodAverage(metrics, "memory_percent");
  const avgDisk = getCurrentPeriodAverage(metrics, "disk_percent");
  const avgLoad = getCurrentPeriodAverage(metrics, "load_avg_1");

  const prevAvgCPU =
    metrics.length > 10
      ? calculatePrevPeriodAverage(metrics, "cpu_percent")
      : null;
  const prevAvgMemory =
    metrics.length > 10
      ? calculatePrevPeriodAverage(metrics, "memory_percent")
      : null;
  const prevAvgDisk =
    metrics.length > 10
      ? calculatePrevPeriodAverage(metrics, "disk_percent")
      : null;
  const prevAvgLoad =
    metrics.length > 10
      ? calculatePrevPeriodAverage(metrics, "load_avg_1")
      : null;

  const cpuDiff = prevAvgCPU !== null ? avgCPU - prevAvgCPU : null;
  const memoryDiff = prevAvgMemory !== null ? avgMemory - prevAvgMemory : null;
  const diskDiff = prevAvgDisk !== null ? avgDisk - prevAvgDisk : null;
  const loadDiff = prevAvgLoad !== null ? avgLoad - prevAvgLoad : null;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">System Metrics</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div
              className="absolute right-0 bottom-0 left-0 opacity-20 transition-all duration-300"
              style={{
                height: `${Math.min(Math.max(currentCPU, 0), 100)}%`,
                backgroundColor:
                  currentCPU <= 50
                    ? "var(--color-ok)"
                    : currentCPU <= 80
                      ? "var(--color-degraded)"
                      : "var(--color-error)",
              }}
            />
            <div
              className="absolute inset-0 bg-white dark:bg-gray-950"
              style={{
                height: `${100 - Math.min(Math.max(currentCPU, 0), 100)}%`,
              }}
            />
            <CardHeader className="relative z-10">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex items-center gap-1">
              <span className="font-mono font-medium text-black proportional-nums dark:text-white">
                {currentCPU.toFixed(1)}%
              </span>
              {cpuDiff === null ? null : cpuDiff === 0 ? (
                <span className="text-muted-foreground text-xs">
                  – Same as last period
                </span>
              ) : cpuDiff > 0 ? (
                <div className="flex items-center gap-1 text-xs text-red-800">
                  <ChevronUp className="inline h-3 w-3" />+
                  {Math.abs(cpuDiff).toFixed(1)}%
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-800">
                  <ChevronDown className="h-3 w-3" />
                  {Math.abs(cpuDiff).toFixed(1)}%
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div
              className="absolute right-0 bottom-0 left-0 opacity-20 transition-all duration-300"
              style={{
                height: `${Math.min(Math.max(currentMemory, 0), 100)}%`,
                backgroundColor:
                  currentMemory <= 70
                    ? "var(--color-ok)"
                    : currentMemory <= 90
                      ? "var(--color-degraded)"
                      : "var(--color-error)",
              }}
            />
            <div
              className="absolute inset-0 bg-white dark:bg-gray-950"
              style={{
                height: `${100 - Math.min(Math.max(currentMemory, 0), 100)}%`,
              }}
            />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Memory Usage
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  {lastMetric.memory_used_gb.toFixed(1)}GB /{" "}
                  {lastMetric.memory_total_gb.toFixed(1)}GB
                </p>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-1">
                <span className="font-mono font-medium text-black proportional-nums dark:text-white">
                  {currentMemory.toFixed(1)}%
                </span>
                {memoryDiff === null ? null : memoryDiff === 0 ? (
                  <span className="text-muted-foreground text-xs">
                    – Same as last period
                  </span>
                ) : memoryDiff > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-red-800">
                    <ChevronUp className="inline h-3 w-3" />+
                    {Math.abs(memoryDiff).toFixed(1)}%
                    <span className="text-muted-foreground">
                      vs last period
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-green-800">
                    <ChevronDown className="h-3 w-3" />
                    {Math.abs(memoryDiff).toFixed(1)}%
                    <span className="text-muted-foreground">
                      vs last period
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div
              className="absolute right-0 bottom-0 left-0 opacity-20 transition-all duration-300"
              style={{
                height: `${Math.min(Math.max(currentDisk, 0), 100)}%`,
                backgroundColor:
                  currentDisk <= 70
                    ? "var(--color-ok)"
                    : currentDisk <= 90
                      ? "var(--color-degraded)"
                      : "var(--color-error)",
              }}
            />
            <div
              className="absolute inset-0 bg-white dark:bg-gray-950"
              style={{
                height: `${100 - Math.min(Math.max(currentDisk, 0), 100)}%`,
              }}
            />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Disk Usage
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  {lastMetric.disk_free_gb.toFixed(1)}GB free
                </p>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-1">
                <span className="font-mono font-medium text-black proportional-nums dark:text-white">
                  {currentDisk.toFixed(1)}%
                </span>
                {diskDiff === null ? null : diskDiff === 0 ? (
                  <span className="text-muted-foreground text-xs">
                    – Same as last period
                  </span>
                ) : diskDiff > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-red-800">
                    <ChevronUp className="inline h-3 w-3" />+
                    {Math.abs(diskDiff).toFixed(1)}%
                    <span className="text-muted-foreground">
                      vs last period
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-green-800">
                    <ChevronDown className="h-3 w-3" />
                    {Math.abs(diskDiff).toFixed(1)}%
                    <span className="text-muted-foreground">
                      vs last period
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div
              className="absolute right-0 bottom-0 left-0 opacity-20 transition-all duration-300"
              style={{
                height: `${Math.min(Math.max((currentLoad / 3) * 100, 0), 100)}%`,
                backgroundColor:
                  currentLoad <= 1
                    ? "var(--color-ok)"
                    : currentLoad <= 2
                      ? "var(--color-degraded)"
                      : "var(--color-error)",
              }}
            />
            <div
              className="absolute inset-0 bg-white dark:bg-gray-950"
              style={{
                height: `${100 - Math.min(Math.max((currentLoad / 3) * 100, 0), 100)}%`,
              }}
            />
            <CardHeader className="relative z-10">
              <CardTitle className="text-sm font-medium">
                Load Average
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex items-center gap-1">
              <span className="font-mono font-medium text-black proportional-nums dark:text-white">
                {currentLoad.toFixed(1)}
              </span>
              {loadDiff === null ? null : loadDiff === 0 ? (
                <span className="text-muted-foreground text-xs">
                  – Same as last period
                </span>
              ) : loadDiff > 0 ? (
                <div className="flex items-center gap-1 text-xs text-red-800">
                  <ChevronUp className="inline h-3 w-3" />+
                  {Math.abs(loadDiff).toFixed(1)}
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-800">
                  <ChevronDown className="h-3 w-3" />
                  {Math.abs(loadDiff).toFixed(1)}
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
