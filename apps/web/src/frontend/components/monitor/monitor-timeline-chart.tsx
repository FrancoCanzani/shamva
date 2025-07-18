import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { Log } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import {
  addMinutes,
  format as formatDate,
  startOfDay,
  startOfHour,
  subDays,
  subHours,
} from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  error: "#dc2626", // bg-red-800
  active: "#166534", // bg-green-800
  degraded: "#eab308", // bg-yellow-500
  empty: "#f3f4f6", // gray-100 for empty
};

function getStatus(log: Partial<Log>): "error" | "active" | "degraded" {
  if (typeof log.ok === "boolean") {
    return log.ok ? "active" : "error";
  }
  return "degraded";
}

function getWorstStatus(logs: Partial<Log>[]): "error" | "degraded" | "active" {
  let hasError = false;
  let hasDegraded = false;
  let hasActive = false;
  for (const log of logs) {
    const status = getStatus(log);
    if (status === "error") hasError = true;
    else if (status === "degraded") hasDegraded = true;
    else if (status === "active") hasActive = true;
  }
  if (hasError) return "error";
  if (hasDegraded) return "degraded";
  if (hasActive) return "active";
  return "active";
}

function getBucketConfig(days: number) {
  if (days === 1) {
    return { bucketSizeMinutes: 60, bucketCount: 24, labelFormat: "HH:00" };
  } else if (days === 7) {
    return {
      bucketSizeMinutes: 360,
      bucketCount: 28,
      labelFormat: "MMM d HH:00",
    }; // 6-hour
  } else if (days === 14) {
    return {
      bucketSizeMinutes: 720,
      bucketCount: 28,
      labelFormat: "MMM d HH:00",
    }; // 12-hour
  } else {
    return { bucketSizeMinutes: 60, bucketCount: 24, labelFormat: "HH:00" };
  }
}

function getTimelineBuckets(
  logs: Partial<Log>[],
  days: number
): {
  status: "error" | "degraded" | "active" | "empty";
  logs: Partial<Log>[];
  start: number;
  end: number;
  label: string;
  count: number;
}[] {
  let startTime: Date;
  if (days === 1) {
    const now = new Date();
    startTime = subHours(startOfHour(now), 24); 
  } else if (days === 7) {
    startTime = startOfDay(subDays(new Date(), 7));
  } else if (days === 14) {
    startTime = startOfDay(subDays(new Date(), 14));
  } else {
    startTime = startOfDay(new Date());
  }
  const { bucketSizeMinutes, bucketCount, labelFormat } = getBucketConfig(days);
  const buckets: {
    logs: Partial<Log>[];
    start: number;
    end: number;
    status: "error" | "degraded" | "active" | "empty";
    label: string;
    count: number;
  }[] = [];
  let bucketStart = startTime;
  for (let i = 0; i < bucketCount; i++) {
    const start = bucketStart.getTime();
    const end = addMinutes(bucketStart, bucketSizeMinutes).getTime();
    const bucketLogs = logs.filter((log) => {
      if (!log.created_at) return false;
      const t = new Date(log.created_at).getTime();
      return t >= start && t < end;
    });
    let status: "error" | "degraded" | "active" | "empty";
    if (bucketLogs.length > 0) {
      status = getWorstStatus(bucketLogs);
    } else {
      status = "empty";
    }
    buckets.push({
      logs: bucketLogs,
      start,
      end,
      status,
      label: formatDate(bucketStart, labelFormat),
      count: bucketLogs.length,
    });
    bucketStart = addMinutes(bucketStart, bucketSizeMinutes);
  }
  return buckets;
}

interface MonitorTimelineChartProps {
  logs?: Partial<Log>[];
  height?: number;
  className?: string;
}

export default function MonitorTimelineChart({
  logs,
  className,
}: MonitorTimelineChartProps) {
  const { days } = Route.useSearch();
  if (!logs) {
    return <Skeleton className="h-24 w-full rounded-sm" />;
  }
  if (!logs.length) {
    logs = [];
  }
  const buckets = getTimelineBuckets(logs, days);
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="flex w-full items-center gap-0.5 overflow-hidden rounded"
          style={{ height: 66, minWidth: 200, maxWidth: 800 }}
        >
          {buckets.map((bucket, i) => {
            const color = STATUS_COLORS[bucket.status] || STATUS_COLORS.empty;
            const count = bucket.logs.length;
            const isEmpty = bucket.status === "empty";
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className={
                      "h-full flex-1 cursor-pointer transition-colors duration-200 " +
                      (isEmpty
                        ? " border border-dotted border-black bg-[#f3f4f6]"
                        : "")
                    }
                    style={{
                      backgroundColor: color,
                      borderRadius:
                        i === 0
                          ? "2px 0 0 2px"
                          : i === buckets.length - 1
                            ? "0 2px 2px 0"
                            : undefined,
                      minWidth: 2,
                      width: `calc(100% / ${buckets.length})`,
                      opacity: isEmpty ? 0.7 : 1,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent
                  sideOffset={4}
                  className="rounded px-3 py-2 text-xs"
                >
                  <div className="mb-1 font-medium">{bucket.label}</div>
                  {isEmpty ? (
                    <div className="text-gray-400">No data</div>
                  ) : (
                    <>
                      <div>
                        Status:{" "}
                        <span
                          className="font-semibold capitalize"
                          style={{ color }}
                        >
                          {bucket.status}
                        </span>
                      </div>
                      <div>Checks: {count}</div>
                    </>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-800"></div>
            <span>Up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-yellow-500"></div>
            <span>Degraded</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-red-800"></div>
            <span>Error</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
