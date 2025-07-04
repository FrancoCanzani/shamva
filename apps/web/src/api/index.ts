import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { EnvBindings } from "../../bindings";
import { handleCheckerCron } from "./crons/checker";
import { CheckerDurableObject } from "./durable-objects/checker-durable-object";
import apiRoutes from "./routes/api";
import getPublicStatusPage from "./routes/status/get";

export { CheckerDurableObject };

const app = new Hono<{ Bindings: EnvBindings }>();

// Middleware
app.use(logger());
app.use(prettyJSON());
app.use(secureHeaders());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? ["http://localhost:3000", "http://localhost:5173"]
        : ["https://shamva.dev", "https://*.shamva.dev"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: [
      "Content-Length",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 600,
    credentials: true,
  })
);

// Global error handler
app.onError((err, c) => {
  console.error("Global error:", err);
  return c.json(
    {
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500
  );
});

// Routes
app.route("/", apiRoutes);
app.get("/status/:slug", getPublicStatusPage);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.mount("/", (req, env) => env.ASSETS.fetch(req));

export default {
  fetch: app.fetch,

  async scheduled(
    // @ts-expect-error - Required by Cloudflare Workers API
    controller: ScheduledController,
    env: EnvBindings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx: ExecutionContext
  ) {
    await handleCheckerCron(env);
  },
};
