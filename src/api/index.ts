import { Hono } from "hono";
import { EnvBindings } from "../../bindings";
import { CheckerDurableObject } from "./lib/classes";
import apiRoutes from "./routes/api";

export { CheckerDurableObject };

export default new Hono<{ Bindings: EnvBindings }>()
  // .use(cors())

  .route("/", apiRoutes)

  .mount("/", (req, env) => env.ASSETS.fetch(req));
