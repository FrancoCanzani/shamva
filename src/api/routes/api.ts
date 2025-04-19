import { Hono } from "hono";
import { validator } from "hono/validator";
import type { EnvBindings } from "../../../bindings";
import { LinkSchema } from "../../lib/schema";
import { generateRandomSlug } from "../../lib/utils";
import { authMiddleware } from "../lib/middleware/auth-middleware";
import { createSupabaseClient } from "../lib/supabase/client";

const apiRoutes = new Hono<{ Bindings: EnvBindings }>();

apiRoutes.use("/api/*", authMiddleware);

apiRoutes.get("/api/test", (c) => {
  return c.text("test");
});

apiRoutes.get("/api/links", async (c) => {
  const links = await c.env.LINKS.list();

  if (!links) {
    return c.json({ error: "Slug to check was not provided" }, 400);
  }

  return c.json({ links });
});

apiRoutes.get("/slug/exists", async (c) => {
  const slug = c.req.query("slug");

  console.log(slug);

  if (!slug) {
    return c.json({ error: "Slug to check was not provided" }, 400);
  }
  const exists = await c.env.LINKS.get(slug);

  console.log(exists);

  if (exists) {
    return c.json({ exists: true });
  }

  return c.json({ exists: false });
});

apiRoutes.post(
  "/shorten",
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

    const slug = body.slug || generateRandomSlug();

    const exists = await c.env.LINKS.get(slug);

    if (exists) {
      return c.json({ error: "Slug is already on use" }, 500);
    }

    const dataToStore = {
      url: body.url,
      slug: slug,
      created_at: new Date().toISOString(),
      click_count: 0,
      user_id: "7c5d55b2-94ff-4066-8ad5-a465ee842969",
      expires_at: null,
      tags: body.tags ?? [],
      is_active: true,
    };

    const supabase = createSupabaseClient(c.env);

    try {
      await c.env.LINKS.put(slug, JSON.stringify(dataToStore));
      const { error } = await supabase
        .from("links")
        .insert(dataToStore)
        .select();

      console.log(error);
      return c.json({ success: true, slug: slug, url: dataToStore.url }, 201);
    } catch (e) {
      console.error("KV Put Error:", e);
      return c.json({ error: "Failed to create link" }, 500);
    }
  },
);

export default apiRoutes;
