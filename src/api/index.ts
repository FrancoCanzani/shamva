import { Hono } from "hono";
import { EnvBindings } from "../../bindings";
import { doHealthCheck } from "./crons/do-health-check";
import { CheckerDurableObject } from "./durable-objects/checker-durable-object";
import apiRoutes from "./routes/api";

export { CheckerDurableObject };

const app = new Hono<{ Bindings: EnvBindings }>();

app.route("/", apiRoutes);
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
