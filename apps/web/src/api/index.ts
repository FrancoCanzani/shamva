import { apiReference } from "@scalar/hono-api-reference";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { EnvBindings } from "../../bindings";
import { handleHeartbeatCheckerCron } from "./crons/heartbeat-checker";
import { handleLogCleanupCron } from "./crons/log-cleanup";
import { handleMonitorCheckerCron } from "./crons/monitor-checker";
import { CheckerDurableObject } from "./durable-objects/checker-durable-object";
import { HttpCheckerDurableObject } from "./durable-objects/http-checker";
import { TcpCheckerDurableObject } from "./durable-objects/tcp-checker";
import { handleApiError } from "./lib/error-handler";
import apiRoutes from "./routes/api";
import { ApiVariables } from "./lib/types";
import registerPublicStatus from "./routes/api/public/status/get";
import registerPublicHeartbeat from "./routes/api/public/heartbeats/get";
import registerPublicMetrics from "./routes/api/public/metrics/post";

export {
  CheckerDurableObject,
  HttpCheckerDurableObject,
  TcpCheckerDurableObject,
};

const app = new Hono<{ Bindings: EnvBindings }>();

app.use(logger());
app.use(prettyJSON());
app.use(secureHeaders());

app.use("/v1/*", timeout(30000));

app.use(
  "/v1/api/*",
  bodyLimit({
    maxSize: 1024 * 1024,
    onError: (c) => {
      return c.json(
        {
          data: null,
          success: false,
          error: "Request body too large - maximum size is 1MB",
        },
        413
      );
    },
  })
);

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
app.onError((err, c) => handleApiError(err, c));

app.get("/health", (c) => c.json({ status: "ok" }));

const v1 = new OpenAPIHono<{
  Bindings: EnvBindings;
  Variables: ApiVariables;
}>().basePath("/v1/api");

v1.route("/", apiRoutes);

v1.doc("/docs", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Shamva API",
    description: "Shamva monitoring and logging API",
  },
});

v1.get(
  "/docs/ui",
  apiReference({
    spec: { url: "/v1/api/docs" },
  })
);

v1.use(
  "/public/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

registerPublicStatus(v1);
registerPublicHeartbeat(v1);
registerPublicMetrics(v1);

app.route("/", v1);

// Handle static assets for everything else
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default {
  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: EnvBindings,
    _ctx: ExecutionContext //eslint-disable-line
  ) {
    switch (controller.cron) {
      case "* * * * *":
        // Every minute - run monitor and heartbeat checks
        await handleMonitorCheckerCron(env);
        await handleHeartbeatCheckerCron(env);
        break;
      case "0 0 * * 1":
        // Every Sunday at midnight - run log cleanup
        await handleLogCleanupCron();
        break;
    }
  },
};
