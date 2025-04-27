import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from "../../../../bindings";
import { createSupabaseClient } from "../supabase/client";

const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 5;
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface InitializePayload {
  urlToCheck: string;
  monitorId: string;
  userId: string;
  intervalMs?: number;
  method: string;
}

export class CheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;
  consecutiveFailures: number;
  lastSuccessfulCheck: number;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.consecutiveFailures = 0;
    this.lastSuccessfulCheck = Date.now();
  }

  private async initialize(params: InitializePayload): Promise<void> {
    const {
      urlToCheck,
      monitorId,
      userId,
      intervalMs = DEFAULT_CHECK_INTERVAL_MS,
      method,
    } = params;

    if (!urlToCheck || !monitorId || !userId) {
      throw new Error(
        "Invalid parameters: urlToCheck, monitorId, userId required for initialization",
      );
    }

    const existingUrl = await this.ctx.storage.get<string>("urlToCheck");
    if (existingUrl) {
      console.log(`DO ${this.ctx.id.toString()} already initialized, skipping`);
      return;
    }

    await this.ctx.storage.put({
      urlToCheck,
      monitorId,
      userId,
      intervalMs,
      method,
      createdAt: Date.now(),
      lastSuccessfulCheck: Date.now(),
      consecutiveFailures: 0,
    });

    const firstAlarmTime = Date.now() + 5000;
    await this.ctx.storage.setAlarm(firstAlarmTime);

    console.log(
      `DO ${this.ctx.id.toString()} initialized for monitor ${monitorId}. Interval: ${intervalMs}ms. First alarm at ${new Date(firstAlarmTime).toISOString()}`,
    );
  }

  async fetch(request: Request): Promise<Response> {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return new Response("Invalid URL format in request", { status: 400 });
    }

    const path = url.pathname;

    if (path === "/initialize" && request.method === "POST") {
      let initParams: InitializePayload;
      try {
        initParams = await request.json();
      } catch {
        return new Response("Invalid JSON body", { status: 400 });
      }

      try {
        await this.initialize(initParams);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        console.error("Error during DO initialization:", err);
        const message = err instanceof Error ? err.message : String(err);
        return new Response(`Initialization failed: ${message}`, {
          status: 400,
        });
      }
    }

    if (path === "/verify" && request.method === "GET") {
      const monitorId = await this.ctx.storage.get<string>("monitorId");
      const urlToCheck = await this.ctx.storage.get<string>("urlToCheck");
      const hasAlarm = (await this.ctx.storage.getAlarm()) !== null;

      if (!monitorId || !urlToCheck || !hasAlarm) {
        return new Response(
          JSON.stringify({
            healthy: false,
            reason: "Missing required configuration or alarm",
            monitorId: monitorId || "missing",
            urlToCheck: urlToCheck ? "present" : "missing",
            hasAlarm,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          healthy: true,
          monitorId,
          lastSuccessfulCheck: await this.ctx.storage.get(
            "lastSuccessfulCheck",
          ),
          consecutiveFailures: await this.ctx.storage.get(
            "consecutiveFailures",
          ),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (path === "/status" && request.method === "GET") {
      const state = {
        monitorId: await this.ctx.storage.get("monitorId"),
        urlToCheck: await this.ctx.storage.get("urlToCheck"),
        userId: await this.ctx.storage.get("userId"),
        method: await this.ctx.storage.get("method"),
        intervalMs: await this.ctx.storage.get("intervalMs"),
        createdAt: await this.ctx.storage.get("createdAt"),
        lastSuccessfulCheck: await this.ctx.storage.get("lastSuccessfulCheck"),
        consecutiveFailures: await this.ctx.storage.get("consecutiveFailures"),
        nextAlarmTime: await this.ctx.storage.getAlarm(),
      };

      return new Response(JSON.stringify(state), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }

  async alarm(): Promise<void> {
    const urlToCheck = await this.ctx.storage.get<string>("urlToCheck");
    const monitorId = await this.ctx.storage.get<string>("monitorId");
    const userId = await this.ctx.storage.get<string>("userId");
    const method = await this.ctx.storage.get<string>("method");
    const intervalMs =
      (await this.ctx.storage.get<number>("intervalMs")) ??
      DEFAULT_CHECK_INTERVAL_MS;
    const doId = this.ctx.id.toString();

    this.consecutiveFailures =
      (await this.ctx.storage.get<number>("consecutiveFailures")) ?? 0;
    this.lastSuccessfulCheck =
      (await this.ctx.storage.get<number>("lastSuccessfulCheck")) ?? Date.now();

    if (!urlToCheck || !monitorId || !userId) {
      console.error(
        `Alarm for DO ${doId}: Missing required data (urlToCheck, monitorId, or userId) in storage. Deleting alarm and state.`,
      );

      try {
        const supabase = createSupabaseClient(this.env);
        await supabase
          .from("monitors")
          .update({
            status: "broken",
            error_message: "Missing required configuration in Durable Object",
          })
          .eq("id", monitorId || "unknown");
      } catch (e) {
        console.error("Failed to report broken monitor:", e);
      }

      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
      return;
    }

    console.log(
      `Alarm triggered for DO ${doId}: Checking URL ${urlToCheck} for monitor ${monitorId}`,
    );

    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      const timeSinceLastSuccess = Date.now() - this.lastSuccessfulCheck;
      if (timeSinceLastSuccess > FAILURE_COOLDOWN_MS) {
        console.warn(
          `Monitor ${monitorId} has had ${this.consecutiveFailures} consecutive failures over ${timeSinceLastSuccess}ms. Entering cooldown mode.`,
        );

        try {
          const supabase = createSupabaseClient(this.env);
          await supabase
            .from("monitors")
            .update({
              status: "error",
              error_message: `${this.consecutiveFailures} consecutive check failures`,
              failure_count: this.consecutiveFailures,
              last_failure_at: new Date().toISOString(),
            })
            .eq("id", monitorId);
        } catch (e) {
          console.error(`Failed to update monitor status after failures: ${e}`);
        }

        const cooldownIntervalMs = Math.min(intervalMs * 3, 15 * 60 * 1000);
        await this.ctx.storage.setAlarm(Date.now() + cooldownIntervalMs);
        console.log(
          `Rescheduled alarm for DO ${doId} in cooldown mode: ${cooldownIntervalMs}ms`,
        );
        return;
      }
    }

    let status: number | null = null;
    let ok: boolean | null = null;
    let latency: number | null = null;
    let headers: Record<string, string> | null = null;
    let bodyContent = null;
    let checkError: string | null = null;
    let colo: string | null = null;
    const checkStartTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(urlToCheck, {
        method: method || "GET",
        redirect: "manual",
        headers: { "User-Agent": "Blinks-Checker/1.0" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      latency = performance.now() - checkStartTime;
      status = response.status;
      ok = response.ok;
      colo = response.cf?.colo ?? null;
      headers = Object.fromEntries(response.headers.entries());

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          bodyContent = await response.json();
        } catch (jsonError) {
          console.warn(
            `Failed to parse JSON response for ${urlToCheck}:`,
            jsonError,
          );
          const textContent = await response.text();
          const truncatedContent = textContent.slice(0, 10000);
          bodyContent = {
            _rawContent: truncatedContent,
            _parseError: String(jsonError),
          };
        }
      } else {
        const textContent = await response.text();
        const truncatedContent = textContent.slice(0, 10000);
        bodyContent = { _rawContent: truncatedContent };
      }

      this.consecutiveFailures = 0;
      this.lastSuccessfulCheck = Date.now();
      await this.ctx.storage.put("consecutiveFailures", 0);
      await this.ctx.storage.put("lastSuccessfulCheck", Date.now());
    } catch (error: unknown) {
      console.error(`Alarm check failed for ${urlToCheck}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      checkError = message;
      status = -1;
      ok = false;
      latency = performance.now() - checkStartTime;

      this.consecutiveFailures++;
      await this.ctx.storage.put(
        "consecutiveFailures",
        this.consecutiveFailures,
      );
    }

    const logData = {
      user_id: userId,
      monitor_id: monitorId,
      do_id: doId,
      url: urlToCheck,
      status: status,
      ok: ok,
      latency: latency,
      headers: headers,
      body_content: bodyContent,
      error: checkError,
      colo: colo,
      method: method,
      created_at: new Date().toISOString(),
    };

    const maxDbRetries = 3;
    let dbRetryCount = 0;
    let logSaved = false;

    while (!logSaved && dbRetryCount < maxDbRetries) {
      try {
        const supabase = createSupabaseClient(this.env);
        const { error: insertError } = await supabase
          .from("logs")
          .insert(logData);

        if (insertError) {
          dbRetryCount++;
          console.error(
            `Failed to insert log for monitor ${monitorId} (attempt ${dbRetryCount}): ${insertError.message}`,
            insertError,
          );

          if (dbRetryCount < maxDbRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * dbRetryCount),
            );
          }
        } else {
          logSaved = true;
          console.log(
            `Log saved for monitor ${monitorId} (Status: ${status}, Latency: ${latency?.toFixed(2)}ms)`,
          );

          /* eslint "@typescript-eslint/no-explicit-any": "off" */
          const monitorUpdate: Record<string, any> = {
            last_check_at: new Date().toISOString(),
          };

          if (ok === false) {
            monitorUpdate.last_failure_at = new Date().toISOString();
            monitorUpdate.failure_count = supabase.rpc("increment", {
              row_id: monitorId,
              table_name: "monitors",
              column_name: "failure_count",
            });

            if (this.consecutiveFailures === 1) {
              monitorUpdate.status = "warning";
            } else if (this.consecutiveFailures >= 3) {
              monitorUpdate.status = "error";
              monitorUpdate.error_message = `${this.consecutiveFailures} consecutive check failures`;
            }
          } else if (ok === true) {
            monitorUpdate.last_success_at = new Date().toISOString();
            monitorUpdate.success_count = supabase.rpc("increment", {
              row_id: monitorId,
              table_name: "monitors",
              column_name: "success_count",
            });

            if (this.consecutiveFailures === 0) {
              monitorUpdate.status = "active";
              monitorUpdate.error_message = null;
            }
          }

          try {
            await supabase
              .from("monitors")
              .update(monitorUpdate)
              .eq("id", monitorId);
          } catch (statusUpdateError) {
            console.error(
              `Failed to update monitor status: ${statusUpdateError}`,
            );
          }
        }
      } catch (dbError: unknown) {
        dbRetryCount++;
        console.error(
          `Database error inserting log for monitor ${monitorId} (attempt ${dbRetryCount}):`,
          dbError,
        );

        if (dbRetryCount < maxDbRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * dbRetryCount),
          );
        }
      }
    }

    if (!logSaved) {
      console.error(
        `Failed to save log for monitor ${monitorId} after ${maxDbRetries} attempts`,
      );
    }

    try {
      await this.ctx.storage.setAlarm(Date.now() + intervalMs);
      console.log(`Rescheduled alarm for DO ${doId} in ${intervalMs}ms`);
    } catch (alarmError) {
      console.error(`Failed to reschedule alarm for DO ${doId}:`, alarmError);
      try {
        await this.ctx.storage.setAlarm(Date.now() + DEFAULT_CHECK_INTERVAL_MS);
        console.log(
          `Rescheduled alarm for DO ${doId} with default interval after failure`,
        );
      } catch (fallbackError) {
        console.error(
          `Critical: Failed to reschedule alarm even with fallback:`,
          fallbackError,
        );
      }
    }
  }
}
