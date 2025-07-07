import type { Log } from "@/frontend/lib/types";
import { isAfter, parseISO, subHours } from "date-fns";

export const calculateAvailability = (
  logs: Partial<Log>[],
  hours: number
): { percentage: number; success: number; total: number } => {
  const now = new Date();
  const timeLimit = subHours(now, hours);
  const relevantLogs = logs.filter(
    (log) => log.created_at && isAfter(parseISO(log.created_at), timeLimit)
  );

  if (relevantLogs.length === 0) {
    return { percentage: 100, success: 0, total: 0 };
  }

  const validLogs = relevantLogs.filter((log) => typeof log.ok === "boolean");

  if (validLogs.length === 0) {
    return { percentage: 0, success: 0, total: relevantLogs.length };
  }

  const successCount = validLogs.filter((log) => log.ok === true).length;

  const totalCount = validLogs.length;
  const percentage = (successCount / totalCount) * 100;

  return { percentage, success: successCount, total: totalCount };
};

export const calculateAverageLatency = (
  logs: Partial<Log>[]
): number | null => {
  const validLatencies = logs
    .map((log) => log.latency)
    .filter(
      (latency): latency is number =>
        typeof latency === "number" && latency >= 0
    );

  if (validLatencies.length === 0) {
    return null;
  }

  const sum = validLatencies.reduce((acc, val) => acc + val, 0);
  return sum / validLatencies.length;
};

export const getStatusColorForCheck = (
  log: Partial<Log> | undefined
): string => {
  if (!log) return "bg-gray-200";

  // For HTTP checks, use status code colors
  if (log.check_type === "http" && typeof log.status_code === "number") {
    if (log.status_code >= 200 && log.status_code < 300) return "bg-green-700";
    if (log.status_code >= 300 && log.status_code < 400) return "bg-blue-700";
    if (log.status_code >= 400 && log.status_code < 500) return "bg-orange-500";
    if (log.status_code >= 500) return "bg-red-700";
    return "bg-red-700";
  }

  // For TCP checks or when status_code is not available, use ok field
  if (typeof log.ok === "boolean") {
    return log.ok ? "bg-green-700" : "bg-red-700";
  }

  // Fallback for unknown status
  return log.error ? "bg-red-700" : "bg-gray-700";
};
