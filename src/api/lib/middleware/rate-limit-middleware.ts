import { Context, Next } from "hono";

const WINDOW_SIZE = 60; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export const rateLimit = () => {
  return async (c: Context, next: Next) => {
    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const key = `rate-limit:${userId}`;
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE * 1000;

    try {
      const requests = await c.env.LINKS.get(key, "json") as number[] || [];
      
      // Remove old requests
      const recentRequests = requests.filter(time => time > windowStart);
      
      if (recentRequests.length >= MAX_REQUESTS) {
        return c.json({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((recentRequests[0] + WINDOW_SIZE * 1000 - now) / 1000),
        }, 429);
      }

      recentRequests.push(now);
      await c.env.LINKS.put(key, JSON.stringify(recentRequests), {
        expirationTtl: WINDOW_SIZE,
      });

      c.header("X-RateLimit-Limit", MAX_REQUESTS.toString());
      c.header("X-RateLimit-Remaining", (MAX_REQUESTS - recentRequests.length).toString());
      c.header("X-RateLimit-Reset", Math.ceil(windowStart / 1000 + WINDOW_SIZE).toString());

      await next();
    } catch (error) {
      console.error("Rate limit error:", error);
      await next(); 
    }
  };
}; 