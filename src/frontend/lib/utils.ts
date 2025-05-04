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
    return "bg-gray-200 dark:bg-gray-700";
  }
  if (status >= 200 && status < 300) {
    return "bg-gray-200 dark:bg-gray-700";
  } else if (status >= 300 && status < 400) {
    return "bg-blue-200 dark:bg-blue-700";
  } else if (status >= 400 && status < 500) {
    return "bg-orange-200 dark:bg-orange-700";
  } else if (status >= 500 || status < 0) {
    return "bg-red-200 dark:bg-red-700";
  }
  return "bg-gray-200 dark:bg-gray-700";
};

export const getStatusTextColor = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "text-gray-700 dark:text-gray-300";
  }
  if (status >= 200 && status < 300) {
    return "text-green-400 dark:text-green-200";
  } else if (status >= 300 && status < 400) {
    return "text-blue-700 dark:text-blue-300";
  } else if (status >= 400 && status < 500) {
    return "text-orange-400 dark:text-orange-500";
  } else if (status >= 500 || status < 0) {
    return "text-red-700 dark:text-red-300";
  }
  return "text-gray-700 dark:text-gray-300";
};

export const getStatusRowClass = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "";
  }
  if (status >= 200 && status < 300) {
    return "hover:bg-slate-100 dark:hover:bg-slate-800/50";
  } else if (status >= 300 && status < 400) {
    return "bg-blue-50 dark:bg-blue-900/20 hover:!bg-blue-100/80 dark:hover:!bg-blue-800/40";
  } else if (status >= 400 && status < 500) {
    return "bg-orange-50/80 dark:bg-orange-900/20 hover:!bg-orange-100/80 dark:hover:!bg-orange-800/40";
  } else if (status >= 500 || status < 0) {
    return "bg-red-50 dark:bg-red-900/20 hover:!bg-red-100/80 dark:hover:!bg-red-800/40";
  }
  return "hover:bg-slate-100 dark:hover:bg-slate-800/50";
};

export function getRegionNameFromCode(regionCode: string): string {
  return regionCodeToNameMap[regionCode] || regionCode;
}

const regionFlagMap = new Map(
  monitoringRegions.map((region) => [region.value, region.flag]),
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
    Object.entries(regionGroups).filter((entry) => entry[1].length > 0),
  );
}
