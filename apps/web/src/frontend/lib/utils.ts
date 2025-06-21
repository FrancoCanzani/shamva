import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { monitoringRegions, regionCodeToNameMap } from "./constants";
import { Log } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    console.error("Clipboard API not supported by this browser.");
    throw new Error("Clipboard API not available.");
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text to clipboard:", err);
    throw new Error("Could not copy text.");
  }
}

export const getStatusColor = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "bg-slate-200 dark:bg-slate-700";
  }
  if (status >= 200 && status < 300) {
    return "bg-green-700 dark:bg-green-700";
  } else if (status >= 300 && status < 400) {
    return "bg-blue-700 dark:bg-blue-700";
  } else if (status >= 400 && status < 500) {
    return "bg-red-700 dark:bg-red-700";
  } else if (status >= 500 || status < 0) {
    return "bg-red-700 dark:bg-red-700";
  }
  return "bg-slate-200 dark:bg-slate-700";
};

export const getStatusTextColor = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "text-slate-700 dark:text-slate-300";
  }
  if (status >= 200 && status < 300) {
    return "text-green-700 dark:text-green-700";
  } else if (status >= 300 && status < 400) {
    return "text-blue-700 dark:text-blue-700";
  } else if (status >= 400 && status < 500) {
    return "text-orange-400 dark:text-orange-700";
  } else if (status >= 500 || status < 0) {
    return "text-red-700 dark:text-red-700";
  }
  return "text-slate-700 dark:text-slate-300";
};

export const getStatusRowClass = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "";
  }
  if (status >= 200 && status < 300) {
    return "hover:bg-slate-100 dark:hover:bg-carbon-800";
  } else if (status >= 300 && status < 400) {
    return "bg-blue-50 dark:bg-blue-900/20 hover:!bg-blue-100/80 dark:hover:!bg-blue-800/40";
  } else if (status >= 400 && status < 500) {
    return "bg-orange-50/80 dark:bg-orange-900/20 hover:bg-orange-100/80 dark:hover:bg-orange-900/10";
  } else if (status >= 500 || status < 0) {
    return "bg-red-50 dark:bg-red-900/20 hover:!bg-red-100/80 dark:hover:!bg-red-800/40";
  }
  return "hover:bg-slate-100 dark:hover:bg-slate-800/50";
};

export function getRegionNameFromCode(regionCode: string): string {
  return regionCodeToNameMap[regionCode] || regionCode;
}

const regionFlagMap = new Map(
  monitoringRegions.map((region) => [region.value, region.flag])
);

export function getRegionFlags(regionCodes: string[]): string {
  if (!Array.isArray(regionCodes)) return "";
  return regionCodes.map((code) => regionFlagMap.get(code) || "❓").join(" ");
}

export function groupLogsByRegion(logs: Partial<Log>[]) {
  const regionGroups: Record<string, Partial<Log>[]> = {};

  monitoringRegions.forEach((region) => {
    regionGroups[region.value] = [];
  });

  logs.forEach((log) => {
    if (!log || !log.region) return;

    if (regionGroups[log.region]) {
      regionGroups[log.region].push(log);
    } else {
      regionGroups[log.region] = [log];
    }
  });

  Object.keys(regionGroups).forEach((region) => {
    regionGroups[region].sort((a, b) => {
      // Handle undefined created_at values
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });
  });

  return Object.fromEntries(
    Object.entries(regionGroups).filter((entry) => entry[1].length > 0)
  );
}

export function calculatePercentile(
  values: number[],
  percentile: number
): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);

  if (Number.isInteger(index)) {
    return sorted[index];
  } else {
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

export const getLatencyColor = (latency: number | null): string => {
  if (latency === null || latency < 0)
    return "text-slate-200 dark:text-slate-800";
  if (latency < 200) return "text-green-700";
  if (latency < 500) return "text-yellow-500";
  if (latency < 1000) return "text-red-500";
  return "text-red-700";
};
