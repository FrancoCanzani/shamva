import { clsx, type ClassValue } from "clsx";
import { format, getYear, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

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
