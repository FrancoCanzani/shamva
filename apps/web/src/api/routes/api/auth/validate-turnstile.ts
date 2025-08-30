import { Hono } from "hono";
import { z } from "zod";
import { EnvBindings } from "../../../../../bindings";

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  challenge_ts?: string;
  "error-codes"?: string[];
}

const turnstileValidationSchema = z.object({
  token: z.string().min(1).max(2048),
  remoteip: z.string().optional(),
});

const app = new Hono<{ Bindings: EnvBindings }>();

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { token, remoteip } = turnstileValidationSchema.parse(body);

    if (!c.env.TURNSTILE_SECRET_KEY) {
      return c.json({ error: "Turnstile not configured" }, 500);
    }

    const formData = new FormData();
    formData.append("secret", c.env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      console.error(
        "Turnstile API error:",
        response.status,
        response.statusText
      );
      return c.json({ error: "Failed to validate token" }, 500);
    }

    const result = (await response.json()) as TurnstileResponse;

    if (!result.success) {
      console.error("Turnstile validation failed:", result["error-codes"]);
      return c.json(
        {
          success: false,
          error: "Invalid token",
          errorCodes: result["error-codes"],
        },
        400
      );
    }

    return c.json({
      success: true,
      hostname: result.hostname,
      action: result.action,
      challengeTs: result.challenge_ts,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data" }, 400);
    }

    console.error("Turnstile validation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
