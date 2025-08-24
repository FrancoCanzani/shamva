import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

const WINDOW_SIZE = 60; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export const rateLimit = () => {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    if (
      path.startsWith("/docs") ||
      path.startsWith("/api/docs") ||
      path.startsWith("/v1/api/docs")
    ) {
      return next();
    }

    const userId = c.get("userId");
    if (!userId) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const key = `rate-limit:${userId}`;
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE * 1000;

    try {
      const requests =
        ((await c.env.RATE_LIMITS.get(key, "json")) as number[]) || [];

      // Remove old requests
      const recentRequests = requests.filter((time) => time > windowStart);

      if (recentRequests.length >= MAX_REQUESTS) {
        const retryAfter = Math.ceil(
          (recentRequests[0] + WINDOW_SIZE * 1000 - now) / 1000
        );
        throw new HTTPException(429, {
          message: `Rate limit exceeded. Retry after ${retryAfter}s`,
        });
      }

      recentRequests.push(now);
      await c.env.RATE_LIMITS.put(key, JSON.stringify(recentRequests), {
        expirationTtl: WINDOW_SIZE,
      });

      c.header("X-RateLimit-Limit", MAX_REQUESTS.toString());
      c.header(
        "X-RateLimit-Remaining",
        (MAX_REQUESTS - recentRequests.length).toString()
      );
      c.header(
        "X-RateLimit-Reset",
        Math.ceil(windowStart / 1000 + WINDOW_SIZE).toString()
      );

      await next();
    } catch (error) {
      console.error("Rate limit error:", error);
      await next();
    }
  };
};
