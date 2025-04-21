import { clsx, type ClassValue } from "clsx";
import { format, getYear, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";
import { DeviceType } from "./types";

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

export function formatLinkDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    const linkYear = getYear(date);
    const currentYear = getYear(new Date());

    const displayFormat = linkYear === currentYear ? "MMM d" : "MMM d, yyyy";

    return format(date, displayFormat);
  } catch (error) {
    console.error("Error formatting date:", error);
    return format(new Date(dateString), "MMM d");
  }
}

export function getDeviceFromUserAgent(
  userAgentString: string | null | undefined,
): DeviceType {
  if (!userAgentString) {
    return "Unknown";
  }

  const ua = userAgentString.toLowerCase();

  if (
    ua.includes("bot") ||
    ua.includes("crawl") ||
    ua.includes("spider") ||
    ua.includes("slurp") ||
    ua.includes("mediapartners") ||
    ua.includes("google") ||
    ua.includes("bingpreview") ||
    ua.includes("facebookexternalhit") ||
    ua.includes("duckduckgo") ||
    ua.includes("yandex") ||
    ua.includes("baidu")
  ) {
    if (ua.includes("googlebot")) return "Bot";
    if (ua.includes("bingbot")) return "Bot";
    return "Bot";
  }

  if (ua.includes("ipad")) return "Tablet";
  if (ua.includes("android") && !ua.includes("mobile")) return "Tablet";
  if (ua.includes("tablet")) return "Tablet";
  if (ua.includes("kindle") || ua.includes("silk/")) return "Tablet";

  if (ua.includes("mobi")) return "Mobile";
  if (
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("android") ||
    ua.includes("windows phone") ||
    ua.includes("blackberry") ||
    ua.includes("bb10") ||
    ua.includes("opera mini") ||
    ua.includes("iemobile") ||
    ua.includes("webos")
  ) {
    return "Mobile";
  }

  return "Desktop";
}
