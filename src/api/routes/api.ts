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

apiRoutes.use("/api/*", authMiddleware);

apiRoutes.get("/api/test", (c) => {
  return c.text("test");
});

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | Array<JsonValue>;
interface JsonObject {
  [key: string]: JsonValue;
}

apiRoutes.use("/api/*", authMiddleware);

apiRoutes.get("/api/test", (c) => {
  return c.text("test");
});

apiRoutes.post("/api/monitors", async (c) => {
  let url: string,
    method: string,
    headers: JsonObject | undefined,
    body: JsonValue | undefined;

  try {
    const jsonData = await c.req.json();
    url = jsonData.url;
    method = jsonData.method;
    headers = jsonData.headers;
    body = jsonData.body;

    if (!url || typeof url !== "string" || url.trim() === "") {
      throw new Error("URL is required and must be a non-empty string.");
    }
    if (!method || typeof method !== "string" || method.trim() === "") {
      throw new Error("Method is required and must be a non-empty string.");
    }
  } catch (err) {
    console.error("Error parsing request body or invalid data:", err);
    return c.json(
      {
        data: null,
        success: false,
        error: "Invalid request body",
        details: String(err),
      },
      400,
    );
  }

  const userId = c.get("userId");

  const doName = `${userId}-${nanoid(5)}`;
  const doId = c.env.CHECKER_DURABLE_OBJECT.idFromName(doName);
  let monitorData = null;

  try {
    const supabase = createSupabaseClient(c.env);
    const { data, error: insertError } = await supabase
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
        `Failed to create monitor record in database: ${insertError.message}`,
      );
    }

    if (!data) {
      throw new Error(
        "Failed to create monitor record: No data returned from database.",
      );
    }
    monitorData = data;
  } catch (error) {
    console.error("Error during monitor database creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to create monitor in database",
        details: String(error),
      },
      500,
    );
  }

  try {
    const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId);
    const initPayload = {
      urlToCheck: monitorData.url,
      monitorId: monitorData.id,
      userId: userId,
      intervalMs: monitorData.interval_ms ?? 60000,
    };

    const response = await doStub.fetch(
      new Request(new URL("/initialize", new URL(c.req.url).origin), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initPayload),
      }),
    );

    if (!response.ok) {
      let errorDetails = `DO returned status ${response.status}`;
      try {
        const errorBody = await response.text();
        errorDetails += `: ${errorBody}`;
      } catch {
        /* Ignore error reading body */
      }
      throw new Error(`Failed to initialize Durable Object. ${errorDetails}`);
    }

    console.log(
      `Successfully initialized DO ${doId.toString()} for monitor ${monitorData.id}`,
    );

    return c.json({
      data: monitorData,
      success: true,
      error: null,
      details: `Monitor created and checker initialized successfully.`,
    });
  } catch (error: unknown) {
    console.error("Error during Durable Object initialization:", error);
    // CRITICAL: Monitor created in DB, but DO initialization failed.
    // Consider adding cleanup logic here (e.g., delete the monitor record)
    // or clearly indicate the partial failure to the user/logs.
    return c.json(
      {
        data: monitorData,
        success: false, // Indicate overall operation failure
        error: "Failed to initialize checker",
        details: `Monitor record created (ID: ${monitorData?.id}), but failed to start the background checker: ${String(error)}`,
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
    const start = performance.now();
    const response = await fetch(urlToCheck, {
      redirect: "manual",
      headers: { "User-Agent": "Blinks-Checker/1.0" },
    });
    const latency = performance.now() - start;

    const status = response.status;
    const statusText = response.statusText;
    const ok = response.ok;
    const headers = Object.fromEntries(response.headers.entries());

    let bodyContent: JsonValue | null = null;

    try {
      if (response.headers.get("content-type")?.includes("application/json")) {
        bodyContent = (await response.json()) as JsonValue;
      } else {
        const textContent = await response.text();
        bodyContent = { _rawContent: textContent.slice(0, 10000) };
      }
    } catch (bodyError) {
      console.error("Error reading response body:", bodyError);
      const message =
        bodyError instanceof Error ? bodyError.message : String(bodyError);
      bodyContent = { _error: `Failed to read body: ${message}` };
    }

    const logData = {
      url: urlToCheck,
      status,
      ok,
      latency,
    };

    const responseData = {
      status: status,
      statusText: statusText,
      ok: ok,
      headers: headers,
      body: bodyContent,
    };

    return c.json({ data: logData, responseDetails: responseData });
  } catch (error) {
    console.error("Error checking URL:", error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json(
      {
        error: "Failed to check URL",
        details: message,
        success: false,
      },
      500,
    );
  }
});

apiRoutes.get("/api/logs", async (c) => {
  const userId = c.get("userId");

  try {
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
      return c.json(
        {
          data: null,
          error: "Failed to get logs from db",
          details: error instanceof Error ? error.message : String(error),
          success: false,
        },
        500,
      );
    }

    return c.json({ data: logs, success: true, error: null });
  } catch (error) {
    console.error("Error getting logs from db:", error);
    return c.json(
      {
        data: null,
        error: "Failed to get logs from db",
        details: error instanceof Error ? error.message : String(error),
        success: false,
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
    const start = performance.now();
    const response = await fetch(urlToCheck, {
      redirect: "manual",
      headers: { "User-Agent": "Blinks-Checker/1.0" },
    });
    const latency = performance.now() - start;

    const status = response.status;
    const statusText = response.statusText;
    const ok = response.ok;
    const headers = Object.fromEntries(response.headers.entries());

    let bodyContent = null;

    try {
      if (response.headers.get("content-type")?.includes("application/json")) {
        bodyContent = await response.json();
      } else {
        bodyContent = await response.text();
      }
    } catch (bodyError) {
      console.error("Error reading response body:", bodyError);
      bodyContent = null;
    }

    const logData = {
      url: urlToCheck,
      status,
      ok,
      latency,
    };

    const responseData = {
      status: status,
      statusText: statusText,
      ok: ok,
      headers: headers,
      body: bodyContent,
    };

    return c.json({ data: logData, responseDetails: responseData });
  } catch (error) {
    console.error("Error checking URL:", error);
  }
});

apiRoutes.get("/api/logs", async (c) => {
  const userId = c.get("userId");

  try {
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
      return c.json(
        {
          data: null,
          error: "Failed to get logs from db",
          details: error instanceof Error ? error.message : String(error),
          success: false,
        },
        500,
      );
    }

    return c.json({ data: logs, success: true, error: null });
  } catch (error) {
    console.error("Error getting logs from db:", error);
    return c.json(
      {
        data: null,
        error: "Failed to get logs from db",
        details: error instanceof Error ? error.message : String(error),
        success: false,
      },
      500,
    );
  }
});

export default apiRoutes;
