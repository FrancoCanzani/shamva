import { Hono } from "hono";
import type { EnvBindings } from "../../../bindings";
import { saveAnalytics } from "../services/save-analytics";

const redirectRoutes = new Hono<{ Bindings: EnvBindings }>();

redirectRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  console.log("Slug requested:", slug);

  const dataString = await c.env.LINKS.get(slug);

  if (!dataString) {
    console.error("Slug not found in KV:", slug);
    return c.text("Slug not found", 404);
  }

  let data;

  try {
    data = JSON.parse(dataString);
  } catch (e) {
    console.error(`Failed to parse KV data for slug "${slug}":`, dataString, e);
    return c.text("Internal Server Error: Invalid data format", 500);
  }

  console.log("Incrementing click count...");
  data.click_count = (data.click_count || 0) + 1;

  console.log("Scheduling KV store update...");
  c.executionCtx?.waitUntil(
    c.env.LINKS.put(slug, JSON.stringify(data))
      .then(() => {
        console.log("KV store update completed.");
      })
      .catch((err) => {
        console.error("KV store update failed:", err);
      }),
  );

  console.log("Scheduling analytics save...");
  c.executionCtx?.waitUntil(
    saveAnalytics(c)
      .then(() => {
        console.log("Analytics save completed.");
      })
      .catch((err) => {
        console.error("Analytics save failed:", err);
      }),
  );

  if (!data.url) {
    console.error(`Missing URL for slug "${slug}":`, data);
    return c.text("Internal Server Error: Missing redirect URL", 500);
  }

  console.log(`Redirecting to: ${data.url}`);
  return c.redirect(data.url, 301);
});

export default redirectRoutes;
