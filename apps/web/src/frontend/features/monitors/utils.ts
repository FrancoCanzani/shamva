import { Log, Incident } from "@/frontend/lib/types";
import { format, startOfDay, subDays } from "date-fns";

const periodToInterval = {
  1: 60, // 1 day: 60-minute intervals (24 bars)
  7: 240, // 7 days: 240-minute intervals (4-hour buckets, 42 bars)
  14: 480, // 14 days: 480-minute intervals (8-hour buckets, 42 bars)
} as const;

export function getStatusFromLog(
  log: Partial<Log>
): "ok" | "error" | "degraded" {
  if (typeof log.ok === "boolean") {
    return log.ok ? "ok" : "error";
  }

  if (typeof log.status_code === "number") {
    if (log.status_code >= 200 && log.status_code < 300) return "ok";
    if (log.status_code >= 400) return "error";
    return "degraded";
  }

  return "degraded";
}

export function mapUptime(logs: Partial<Log>[], days: number = 7) {
  const now = new Date();
  const intervalMinutes =
    periodToInterval[days as keyof typeof periodToInterval] || 240;

  // Calculate start date
  const fromDate = startOfDay(subDays(now, days));
  const toDate = now;

  // Calculate total duration and number of buckets
  const totalMinutes = Math.floor(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60)
  );
  const numBuckets = Math.ceil(totalMinutes / intervalMinutes);

  const buckets: Array<{
    interval: string;
    ok: number;
    error: number;
    degraded: number;
    success: number;
    total: number;
  }> = [];

  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = new Date(
      fromDate.getTime() + i * intervalMinutes * 60 * 1000
    );
    const bucketEnd = new Date(
      fromDate.getTime() + (i + 1) * intervalMinutes * 60 * 1000
    );

    const bucketLogs = logs.filter((log) => {
      if (!log.created_at) return false;
      const logDate = new Date(log.created_at);
      return logDate >= bucketStart && logDate < bucketEnd;
    });

    let okCount = 0;
    let errorCount = 0;
    let degradedCount = 0;

    bucketLogs.forEach((log) => {
      const status = getStatusFromLog(log);
      if (status === "ok") okCount++;
      else if (status === "error") errorCount++;
      else if (status === "degraded") degradedCount++;
    });

    const intervalFormat = days === 1 ? "HH:mm" : "MMM d, HH:mm";
    
    buckets.push({
      interval: format(bucketStart, intervalFormat),
      ok: okCount,
      success: okCount,
      error: errorCount,
      degraded: degradedCount,
      total: okCount + errorCount + degradedCount,
    });
  }

  return buckets;
}

export function calculateDowntime(incident: Partial<Incident>): string | null {
  if (!incident.started_at) return null;

  const startTime = new Date(incident.started_at).getTime();
  const endTime = incident.resolved_at 
    ? new Date(incident.resolved_at).getTime() 
    : Date.now();
  
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
}
