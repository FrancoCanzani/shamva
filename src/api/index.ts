import { Hono } from "hono";
import { EnvBindings } from "../../bindings";
import apiRoutes from "./routes/api";
import redirectRoutes from "./routes/redirect";

export default new Hono<{ Bindings: EnvBindings }>()
  // .use(cors())

  .route("/", redirectRoutes)
  .route("/", apiRoutes)
  .get("/links/all", async (c) => {
    const links = await c.env.LINKS.list();

    if (!links) {
      return c.json({ error: "Slug to check was not provided" }, 400);
    }

    return c.json({ links });
  })

  // Serve static assets (e.g., frontend files)
  .mount("/", (req, env) => env.ASSETS.fetch(req));
