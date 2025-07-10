import { Context } from "hono";
import { BaseError } from "./errors/base-error";

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

export function handleBodyParsing(rawBody: unknown): unknown {
  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody);
    } catch {
      throw new Error("Invalid JSON format");
    }
  }
  return rawBody;
}

export default handleBodyParsing;
