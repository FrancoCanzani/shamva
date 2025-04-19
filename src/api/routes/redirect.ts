import { Hono } from "hono";
import type { EnvBindings } from "../../../bindings";

const redirectRoutes = new Hono<{ Bindings: EnvBindings }>();

redirectRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const dataString = await c.env.LINKS.get(slug);

  if (!dataString) {
    return c.text("Slug not found", 404);
  }

  let data;

  try {
    data = JSON.parse(dataString);
  } catch (e) {
    console.error(`Failed to parse KV data for slug "${slug}":`, dataString, e);
    return c.text("Internal Server Error: Invalid data format", 500);
  }

  data.click_count = (data.click_count || 0) + 1;

  c.executionCtx.waitUntil(c.env.LINKS.put(slug, JSON.stringify(data)));

  if (!data.url) {
    console.error(`Missing url for slug "${slug}":`, data);
    return c.text("Internal Server Error: Missing redirect URL", 500);
  }
  return c.redirect(data.url, 301);
});

export default redirectRoutes;
