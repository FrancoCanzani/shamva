import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { EnvBindings } from "../../bindings";
import { handleHeartbeatCheckerCron } from "./crons/heartbeat-checker";
import { handleLogCleanupCron } from "./crons/log-cleanup";
import { handleMonitorCheckerCron } from "./crons/monitor-checker";
import { CheckerDurableObject } from "./durable-objects/checker-durable-object";
import { HttpCheckerDurableObject } from "./durable-objects/http-checker";
import { TcpCheckerDurableObject } from "./durable-objects/tcp-checker";
import apiRoutes from "./routes/api";
import getPublicStatusPage from "./routes/status/get";


export {
  CheckerDurableObject,
  HttpCheckerDurableObject,
  TcpCheckerDurableObject,
};

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

// Example of accessing env.NAME
app.get("/debug", (c) => {
  const env = c.env;
  console.log("Environment name:", env.NAME);
  return c.json({ name: env.NAME });
});

app.mount("/", (req, env) => env.ASSETS.fetch(req));

export default {
  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: EnvBindings,
    _ctx: ExecutionContext
  ) {
    console.log("Running scheduled task in environment:", env.NAME);

    switch (controller.cron) {
      case "* * * * *":
        // Every minute - run monitor and heartbeat checks
        await handleMonitorCheckerCron(env);
        await handleHeartbeatCheckerCron(env);
        break;
      case "0 0 * * 0":
        // Every Sunday at midnight - run log cleanup
        await handleLogCleanupCron(env);
        break;
    }
  },
};
