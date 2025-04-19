import { Hono } from "hono";
import type { EnvBindings } from "../../../bindings";
import { saveAnalytics } from "../services/save-analytics";

const redirectRoutes = new Hono<{ Bindings: EnvBindings }>();

redirectRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  console.log("Slug requested:", slug);

  // Retrieve the slug data from the KV store
  const dataString = await c.env.LINKS.get(slug);

  if (!dataString) {
    console.error("Slug not found in KV:", slug);
    return c.text("Slug not found", 404);
  }

  let data;

  try {
    // Parse the data from the KV store
    data = JSON.parse(dataString);
  } catch (e) {
    console.error(`Failed to parse KV data for slug "${slug}":`, dataString, e);
    return c.text("Internal Server Error: Invalid data format", 500);
  }

  // Increment the click count
  data.click_count = (data.click_count || 0) + 1;

  // Update the KV store with the new click count
  c.executionCtx.waitUntil(c.env.LINKS.put(slug, JSON.stringify(data)));

  // Save analytics data asynchronously
  c.executionCtx.waitUntil(saveAnalytics(c));

  // Ensure the URL exists in the data
  if (!data.url) {
    console.error(`Missing URL for slug "${slug}":`, data);
    return c.text("Internal Server Error: Missing redirect URL", 500);
  }

  console.log(`Redirecting to: ${data.url}`);
  return c.redirect(data.url, 301);
});

export default redirectRoutes;
