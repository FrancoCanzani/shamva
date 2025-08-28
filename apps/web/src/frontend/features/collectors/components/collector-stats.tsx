import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Metric } from "../types";

function calculateAverage(metrics: Metric[], key: keyof Metric): number {
  const values = metrics
    .map((metric) => Number(metric[key]))
    .filter((value) => !isNaN(value) && value > 0);
  
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculatePrevPeriodAverage(metrics: Metric[], key: keyof Metric): number {
  // Sort metrics by date (oldest first)
  const sortedMetrics = [...metrics].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // Split into two equal periods: previous period (first half) vs current period (second half)
  const midPoint = Math.floor(sortedMetrics.length / 2);
  const prevMetrics = sortedMetrics.slice(0, midPoint);
  
  return calculateAverage(prevMetrics, key);
}

function getCurrentPeriodAverage(metrics: Metric[], key: keyof Metric): number {
  // Sort metrics by date (oldest first)
  const sortedMetrics = [...metrics].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // Get current period (second half)
  const midPoint = Math.floor(sortedMetrics.length / 2);
  const currentMetrics = sortedMetrics.slice(midPoint);
  
  return calculateAverage(currentMetrics, key);
}

export default function CollectorStats({ 
  metrics
}: { 
  metrics: Metric[];
}) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const lastMetric = metrics[0];
  const currentCPU = lastMetric.cpu_percent;
  const currentMemory = lastMetric.memory_percent;
  const currentDisk = lastMetric.disk_percent;
  const currentLoad = lastMetric.load_avg_1;

  // Calculate current period averages (using the more recent half of data)
  const avgCPU = getCurrentPeriodAverage(metrics, 'cpu_percent');
  const avgMemory = getCurrentPeriodAverage(metrics, 'memory_percent');
  const avgDisk = getCurrentPeriodAverage(metrics, 'disk_percent');
  const avgLoad = getCurrentPeriodAverage(metrics, 'load_avg_1');

  // Calculate previous period averages (using the older half of data)
  const prevAvgCPU = metrics.length > 10 ? calculatePrevPeriodAverage(metrics, 'cpu_percent') : null;
  const prevAvgMemory = metrics.length > 10 ? calculatePrevPeriodAverage(metrics, 'memory_percent') : null;
  const prevAvgDisk = metrics.length > 10 ? calculatePrevPeriodAverage(metrics, 'disk_percent') : null;
  const prevAvgLoad = metrics.length > 10 ? calculatePrevPeriodAverage(metrics, 'load_avg_1') : null;

  const cpuDiff = prevAvgCPU !== null ? avgCPU - prevAvgCPU : null;
  const memoryDiff = prevAvgMemory !== null ? avgMemory - prevAvgMemory : null;
  const diskDiff = prevAvgDisk !== null ? avgDisk - prevAvgDisk : null;
  const loadDiff = prevAvgLoad !== null ? avgLoad - prevAvgLoad : null;

  const StatCard = ({ 
    title, 
    current, 
    diff, 
    unit,
    subtitle
  }: {
    title: string;
    current: number;
    diff: number | null;
    unit: string;
    subtitle?: string;
  }) => {
    const getStatusColor = (value: number, title: string): string => {
      if (title.includes('CPU')) {
        if (value <= 50) return "var(--color-ok)";
        if (value <= 80) return "var(--color-degraded)";
        return "var(--color-error)";
      }
      
      if (title.includes('Memory') || title.includes('Disk')) {
        if (value <= 70) return "var(--color-ok)";
        if (value <= 90) return "var(--color-degraded)";
        return "var(--color-error)";
      }
      
      if (title.includes('Load')) {
        if (value <= 1) return "var(--color-ok)";
        if (value <= 2) return "var(--color-degraded)";
        return "var(--color-error)";
      }
      
      return "#6b7280";
    };

    let percentage: number;
    if (title.includes('Load')) {
      percentage = Math.min(Math.max((current / 3) * 100, 0), 100);
    } else {
      percentage = Math.min(Math.max(current, 0), 100);
    }

    const fillColor = getStatusColor(current, title);

    return (
      <Card className="relative overflow-hidden">
        <div 
          className="absolute bottom-0 left-0 right-0 transition-all duration-300 opacity-20"
          style={{ 
            height: `${percentage}%`,
            backgroundColor: fillColor
          }}
        />
        <div className="absolute inset-0 bg-white" style={{ height: `${100 - percentage}%` }} />
        <CardHeader className="relative z-10">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {subtitle && (
            <p className="text-muted-foreground text-xs mb-1">
              {subtitle}
            </p>
          )}
          <div className="flex items-center gap-1">
            <span className="font-mono font-medium text-black proportional-nums dark:text-white">
              {current.toFixed(1)}{unit}
            </span>
            {diff !== null && Math.abs(diff) >= 0.1 && (
              <div className={`flex items-center gap-1 text-xs truncate ${diff > 0 ? 'text-red-800' : 'text-green-800'}`}>
                {diff > 0 ? (
                  <ChevronUp className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                )}
                <span className="truncate">
                  {Math.abs(diff).toFixed(1)}{unit} vs last period
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          title="CPU Usage"
          current={currentCPU}
          diff={cpuDiff}
          unit="%"
        />
        <StatCard
          title="Memory Usage"
          current={currentMemory}
          diff={memoryDiff}
          unit="%"
          subtitle={`${lastMetric.memory_used_gb.toFixed(1)}GB / ${lastMetric.memory_total_gb.toFixed(1)}GB`}
        />
        <StatCard
          title="Disk Usage"
          current={currentDisk}
          diff={diskDiff}
          unit="%"
          subtitle={`${lastMetric.disk_free_gb.toFixed(1)}GB free`}
        />
        <StatCard
          title="Load Average"
          current={currentLoad}
          diff={loadDiff}
          unit=""
        />
      </div>
    </div>
  );
}
