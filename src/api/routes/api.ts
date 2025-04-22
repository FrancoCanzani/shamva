import { Hono } from "hono";
import { nanoid } from "nanoid";
import type { EnvBindings } from "../../../bindings";
import { authMiddleware } from "../lib/middleware/auth-middleware";
import { createSupabaseClient } from "../lib/supabase/client";
import { ApiVariables } from "../lib/types";

const apiRoutes = new Hono<{
  Bindings: EnvBindings;
  Variables: ApiVariables;
}>();

const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;

apiRoutes.use("/api/*", authMiddleware);

apiRoutes.get("/api/test", (c) => {
  return c.text("test");
});

apiRoutes.post("/api/monitors", async (c) => {
  let url, method, headers, body;
  try {
    ({ url, method, headers, body } = await c.req.json());
    if (
      !url ||
      typeof url !== "string" ||
      !method ||
      typeof method !== "string"
    ) {
      throw new Error("Invalid input data: URL and Method are required.");
    }
  } catch (err) {
    console.error("Error parsing request body or invalid data:", err);
    return c.json(
      { error: "Invalid request body", details: err || String(err) },
      400,
    );
  }

  const userId = c.get("userId");
  const hostname = new URL(url).hostname;
  const doName = `${userId}-${hostname}-${nanoid(8)}`;
  const doId = c.env.CHECKER_DURABLE_OBJECT.idFromName(doName);
  const stub = c.env.CHECKER_DURABLE_OBJECT.get(doId);

  try {
    const { data: monitorData, error: insertError } =
      await createSupabaseClient(c.env)
        .from("monitors")
        .insert([
          {
            url: url,
            method: method,
            headers: headers ?? {},
            body: body,
            user_id: userId,
            do_id: doId.toString(),
          },
        ])
        .select()
        .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw new Error(
        `Failed to create monitor record: ${insertError.message}`,
      );
    }

    if (!monitorData) {
      throw new Error("Failed to create monitor record: No data returned.");
    }

    await stub.initialize({
      urlToCheck: url,
      monitorId: monitorData.id,
      userId: userId,
      intervalMs: monitorData.interval_ms || DEFAULT_CHECK_INTERVAL_MS,
    });

    return c.json({ data: monitorData });
  } catch (error) {
    console.error("Error during monitor creation or DO initialization:", error);
    return c.json(
      {
        error: "Failed to create monitor",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

apiRoutes.get("/api/check", async (c) => {
  const urlToCheck = c.req.query("url");

  if (!urlToCheck) {
    return c.json({ error: "Provide a url to check" }, 400);
  }

  try {
    const id = c.env.CHECKER_DURABLE_OBJECT.idFromName("checker");
    const stub = c.env.CHECKER_DURABLE_OBJECT.get(id);

    const response = await stub.fetch(new Request(urlToCheck));

    const data = await response.json();

    return c.json({ data });
  } catch (error) {
    console.error("Error checking URL:", error);
    return c.json(
      {
        error: "Failed to check URL",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

apiRoutes.get("/api/logs", async (c) => {
  const userId = c.get("userId");

  const supabase = createSupabaseClient(c.env);

  const { data: logs, error } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: true,
    })
    .limit(50);

  if (error) {
    return c.json({ error: "Error fetching logs from db" });
  }

  console.log(logs);
  return c.json({ logs });
});

export default apiRoutes;
