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

    const now = Date.now();
    await this.ctx.storage.put({
      urlToCheck,
      monitorId,
      userId,
      intervalMs,
      method,
      createdAt: now,
      lastSuccessfulCheck: now,
      consecutiveFailures: 0,
    });

    const firstAlarmTime = now + 5000;
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
            details: {
              monitorId: monitorId || "missing",
              urlToCheck: urlToCheck ? "present" : "missing",
              hasAlarm,
            },
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
      const state = await this.ctx.storage.list();
      const alarmTime = await this.ctx.storage.getAlarm();
      const responseState = Object.fromEntries(state.entries());
      responseState.nextAlarmTime = alarmTime;
      responseState.currentInstanceFailures = this.consecutiveFailures; // Show in-memory value too
      responseState.currentInstanceLastSuccess = this.lastSuccessfulCheck; // Show in-memory value too

      return new Response(JSON.stringify(responseState), {
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
      (await this.ctx.storage.get<number>("lastSuccessfulCheck")) ?? Date.now(); // Use stored value or default to now

    if (!urlToCheck || !monitorId || !userId) {
      console.error(
        `Alarm for DO ${doId}: Missing required data (urlToCheck, monitorId, or userId) in storage. Attempting to report error and self-destruct.`,
      );
      try {
        // notify the user that there is a misconfiguration
        // Try to report the issue if we have a monitorId
        if (monitorId) {
          const supabase = createSupabaseClient(this.env);
          await supabase
            .from("monitors")
            .update({
              status: "error",
              error_message:
                "Critical DO Error: Missing required configuration",
            })
            .eq("id", monitorId);
        }
      } catch (e) {
        console.error(`Failed to report broken monitor ${monitorId}:`, e);
      }
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
      console.warn(
        `DO ${doId} state and alarm deleted due to missing configuration.`,
      );
      return;
    }

    console.log(
      `Alarm triggered for DO ${doId}: Checking URL ${urlToCheck} for monitor ${monitorId} (Failures: ${this.consecutiveFailures})`,
    );

    // Cooldown Logic
    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      const timeSinceLastSuccess = Date.now() - this.lastSuccessfulCheck;

      if (timeSinceLastSuccess > FAILURE_COOLDOWN_MS) {
        console.warn(
          `Monitor ${monitorId} (DO ${doId}) has had ${this.consecutiveFailures} consecutive failures over ${timeSinceLastSuccess}ms. Entering cooldown period.`,
        );

        // we notify (todo) the user there has been x consecutive failures and change the status to error

        try {
          const supabase = createSupabaseClient(this.env);
          await supabase
            .from("monitors")
            .update({
              status: "error",
              error_message: `${this.consecutiveFailures} consecutive failures. Cooldown active.`,
              last_check_at: new Date().toISOString(),
            })
            .eq("id", monitorId);
        } catch (e) {
          console.error(
            `Failed to update monitor ${monitorId} status entering cooldown:`,
            e,
          );
        }

        // Schedule the next check after a longer cooldown interval
        const cooldownIntervalMs = Math.min(intervalMs * 3, 15 * 60 * 1000); // 3x interval or max 15 mins
        await this.ctx.storage.setAlarm(Date.now() + cooldownIntervalMs);
        console.log(
          `Rescheduled alarm for DO ${doId} in cooldown mode: next check in ${cooldownIntervalMs}ms`,
        );
        return;
      } else {
        console.log(
          `Monitor ${monitorId} (DO ${doId}) has ${this.consecutiveFailures} failures, but only ${timeSinceLastSuccess}ms since last success. Not entering cooldown yet.`,
        );
      }
    }

    let status_code: number | null = null;
    let ok: boolean | null = null;
    let latency: number | null = null;
    let headers: Record<string, string> | null = null;
    let bodyContent: any = null;
    let checkError: string | null = null;
    let colo: string | null = null;
    const checkStartTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(urlToCheck, {
        method: method || "GET",
        redirect: "manual", // Do not follow redirects automatically
        headers: { "User-Agent": "Blinks-Checker/1.0" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      ok = response.ok;
      latency = performance.now() - checkStartTime;
      status_code = response.status;
      colo = response.cf?.colo ?? null;
      headers = Object.fromEntries(response.headers.entries());

      const contentType = response.headers.get("content-type") ?? "";
      try {
        const textContent = await response.text();
        const truncatedContent = textContent.slice(0, 10000); // Limit body size

        if (contentType.includes("application/json")) {
          try {
            bodyContent = JSON.parse(truncatedContent);
            if (textContent.length > 10000) {
              if (typeof bodyContent === "object" && bodyContent !== null) {
                bodyContent._truncated = true;
              } else {
                bodyContent = {
                  _rawContent: truncatedContent,
                  _truncated: true,
                  _parseError: "Truncated content might be invalid JSON",
                };
              }
            }
          } catch (jsonError) {
            console.warn(
              `Failed to parse JSON response for ${urlToCheck} (might be truncated):`,
              jsonError,
            );
            bodyContent = {
              _rawContent: truncatedContent,
              _parseError: String(jsonError),
            };
          }
        } else {
          bodyContent = { _rawContent: truncatedContent };
          if (textContent.length > 10000) {
            bodyContent._truncated = true;
          }
        }
      } catch (bodyReadError) {
        console.warn(
          `Failed to read response body for ${urlToCheck}:`,
          bodyReadError,
        );
        bodyContent = { _readError: String(bodyReadError) };
        // 'ok' status might still be true even if body read fails later
      }

      const lastStatusCode =
        await this.ctx.storage.get<number>("lastStatusCode");

      if (
        lastStatusCode !== undefined &&
        status_code !== null &&
        status_code !== lastStatusCode
      ) {
        console.info(
          `Status code changed for monitor ${monitorId} (${urlToCheck}): ${lastStatusCode} -> ${status_code}`,
        );
        const wasPreviouslyOk = lastStatusCode >= 200 && lastStatusCode < 400;
        const isCurrentlyOk =
          ok === true ||
          (status_code !== null && status_code >= 300 && status_code < 400);

        if (wasPreviouslyOk && !isCurrentlyOk) {
          console.warn(
            `Monitor ${monitorId} check changed from OK (${lastStatusCode}) to failing (${status_code}).`,
          );
          // TODO: Trigger "down" notification maybe? Depends on consecutive failures logic below.
        } else if (!wasPreviouslyOk && isCurrentlyOk) {
          console.info(
            `Monitor ${monitorId} check changed from failing (${lastStatusCode}) to OK (${status_code}).`,
          );
          // TODO: Trigger "recovered" notification
        }
      }

      this.consecutiveFailures = 0;
      this.lastSuccessfulCheck = Date.now();

      await this.ctx.storage.put({
        lastStatusCode: status_code,
        consecutiveFailures: 0,
        lastSuccessfulCheck: this.lastSuccessfulCheck,
      });
    } catch (error: unknown) {
      latency = performance.now() - checkStartTime;
      ok = false;
      status_code = -1;
      if (error instanceof Error) {
        checkError = error.message;
        if (error.name === "AbortError") {
          checkError = "Timeout during fetch";
        }
      } else {
        checkError = String(error);
      }
      console.error(
        `Alarm check failed for ${urlToCheck} (Monitor: ${monitorId}):`,
        checkError,
      );

      this.consecutiveFailures++;
      await this.ctx.storage.put(
        "consecutiveFailures",
        this.consecutiveFailures,
      );
      // lastSuccessfulCheck is NOT updated here
      // lastStatusCode might be kept as the previous value, or set to -1? Let's keep previous one.
    }

    const logData = {
      user_id: userId,
      monitor_id: monitorId,
      do_id: doId,
      url: urlToCheck,
      status_code: status_code,
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
          throw insertError;
        }

        logSaved = true;
        console.log(
          `Log saved for monitor ${monitorId} (Status: ${status_code}, Latency: ${latency?.toFixed(2)}ms, OK: ${ok})`,
        );

        /* eslint "@typescript-eslint/no-explicit-any": "off" */
        const monitorUpdate: Record<string, any> = {
          last_check_at: new Date().toISOString(),
        };

        if (ok === false || (status_code !== null && status_code >= 400)) {
          // Treat non-ok fetch status OR 4xx/5xx HTTP codes as failures for monitor status
          monitorUpdate.last_failure_at = new Date().toISOString();
          monitorUpdate.status = "error";
        } else if (ok === true && (status_code === null || status_code < 400)) {
          // Treat ok fetch status AND < 400 HTTP code as success
          monitorUpdate.last_success_at = new Date().toISOString();
          // Increment success count (ideally using DB function)
          // monitorUpdate.success_count = supabase.rpc("increment", { ... });

          // If it was failing before (consecutiveFailures was > 0 before this check reset it)
          // or if the status was not 'active', reset it to 'active'.
          const previousFailures = await this.ctx.storage.get<number>(
            "consecutiveFailures",
          ); // Re-read the value *before* it was reset
          if (previousFailures === 0) {
            // It was already ok
            monitorUpdate.status = "active"; // Ensure it's active
            monitorUpdate.error_message = null; // Clear any previous error
          } else {
            // It just recovered
            monitorUpdate.status = "active"; // Back to active
            monitorUpdate.error_message = null; // Clear error message
            console.info(`Monitor ${monitorId} recovered.`);
            // TODO: Trigger recovery notification here if needed
          }
        }

        // Attempt to update the monitor's status
        try {
          const { error: updateError } = await supabase
            .from("monitors")
            .update(monitorUpdate)
            .eq("id", monitorId);

          if (updateError) {
            console.error(
              `Failed to update monitor ${monitorId} status after log save:`,
              updateError,
            );
            // Log was saved, but status update failed. Continue to rescheduling.
          } else {
            console.log(`Monitor ${monitorId} status updated successfully.`);
          }
        } catch (statusUpdateError) {
          console.error(
            `Error during monitor ${monitorId} status update:`,
            statusUpdateError,
          );
        }
      } catch (dbError: any) {
        // Catch Supabase errors or others
        dbRetryCount++;
        console.error(
          `DB Error for monitor ${monitorId} (attempt ${dbRetryCount}/${maxDbRetries}): ${dbError.message ?? String(dbError)}`,
        );
        if (dbRetryCount < maxDbRetries) {
          // Exponential backoff for retries
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * dbRetryCount),
          );
        }
      }
    }

    if (!logSaved) {
      console.error(
        `Failed to save log for monitor ${monitorId} after ${maxDbRetries} attempts. Check results may be lost.`,
      );
      // Optionally, try to update monitor status to indicate logging failure?
      // Or rely on the next check.
    }

    // reschedule the next Alarm
    try {
      await this.ctx.storage.setAlarm(Date.now() + intervalMs);
      console.log(`Rescheduled alarm for DO ${doId} in ${intervalMs}ms`);
    } catch (alarmError) {
      console.error(`Failed to reschedule alarm for DO ${doId}:`, alarmError);
      // Attempt to reschedule with default interval as a fallback
      try {
        const fallbackTime = Date.now() + DEFAULT_CHECK_INTERVAL_MS;
        await this.ctx.storage.setAlarm(fallbackTime);
        console.warn(
          `Rescheduled alarm for DO ${doId} with default interval (${DEFAULT_CHECK_INTERVAL_MS}ms) after primary reschedule failure.`,
        );
      } catch (fallbackError) {
        // This is critical - the DO might stop running checks.
        console.error(
          `CRITICAL: Failed to reschedule alarm for DO ${doId} even with fallback interval:`,
          fallbackError,
        );
        // Try reporting this critical state
        try {
          const supabase = createSupabaseClient(this.env);
          await supabase
            .from("monitors")
            .update({
              status: "error",
              error_message: "Critical DO Error: Failed to set next alarm",
            })
            .eq("id", monitorId);
        } catch (reportError) {
          console.error(
            `Failed to report critical alarm scheduling error for monitor ${monitorId}:`,
            reportError,
          );
        }
      }
    }
  }
}
