import { Context } from "hono";
import { BaseError } from "./errors/base-error";
import type { BodyContent } from "./types";

export function getUserId(c: Context): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new BaseError("User not authenticated", {
      errorCode: "AUTH_001",
      category: "AUTH",
      severity: "HIGH",
      status: 401,
    });
  }
  return userId;
}

export function calculateDowntime(
  lastSuccessAt: string,
  currentTime: Date
): string {
  const lastSuccess = new Date(lastSuccessAt);
  const diffMs = currentTime.getTime() - lastSuccess.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
}

export const MAX_BODY_CAPTURE_BYTES = 64 * 1024; // 64KB

export function buildBodyContent(
  bodyText: string | null,
  contentType?: string | null
): BodyContent | null {
  if (bodyText === null || bodyText === undefined) return null;

  const isJsonContentType = !!contentType
    ?.toLowerCase()
    .includes("application/json");
  const truncated = bodyText.length > MAX_BODY_CAPTURE_BYTES;
  const raw = truncated ? bodyText.slice(0, MAX_BODY_CAPTURE_BYTES) : bodyText;

  let parsed: Record<string, unknown> | null | undefined = undefined;
  let parseError: string | null = null;

  if (isJsonContentType && !truncated) {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = null;
      parseError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    raw,
    truncated,
    parsed,
    contentType: contentType ?? null,
    parseError,
  };
}

export default buildBodyContent;
