import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { EnvBindings } from "../../bindings";
import { doHealthCheck } from "./crons/do-health-check";
import { CheckerDurableObject } from "./durable-objects/checker-durable-object";
import apiRoutes from "./routes/api";
import getPublicStatusPage from "./routes/status/get";

export { CheckerDurableObject };

const app = new Hono<{ Bindings: EnvBindings }>();

app.use(logger());
app.use(prettyJSON());

app.route("/", apiRoutes);
app.get("/status/:slug", getPublicStatusPage);

app.mount("/", (req, env) => env.ASSETS.fetch(req));

export default {
  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: EnvBindings,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(doHealthCheck(env, controller.scheduledTime));
  },
};
