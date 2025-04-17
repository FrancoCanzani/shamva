import { Hono } from "hono";
import { validator } from "hono/validator";
import type { Env } from "../../bindings";
import { LinkSchema } from "../lib/schema";
import { generateRandomSlug } from "../lib/utils";
import redirectRoutes from "./routes/redirect";

const app = new Hono<Env>();

app.get("/api/some", async (c) => {
  c.text("some");
});

app.post(
  "/api/link/new",
  validator("json", (value, c) => {
    const parsed = LinkSchema.safeParse(value);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        400,
      );
    }
    return parsed.data;
  }),

  async (c) => {
    const body = c.req.valid("json");

    const dataToStore = {
      url: body.url,
      created_at: new Date().toISOString(),
      click_count: 0,
      user_id: "franco",
      expires_at: null,
      last_accessed_at: null,
      tags: body.tags ?? [],
      is_active: true,
    };

    const slug = body.slug || generateRandomSlug();

    try {
      await c.env.LINKS.put(slug, JSON.stringify(dataToStore));
      return c.json({ success: true, slug: slug, url: dataToStore.url }, 201);
    } catch (e) {
      console.error("KV Put Error:", e);
      return c.json({ error: "Failed to create link" }, 500);
    }
  },
);

app.route("/", redirectRoutes);

export default app;
