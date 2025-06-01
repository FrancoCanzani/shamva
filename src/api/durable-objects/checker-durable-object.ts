import { PostgrestError } from "@supabase/supabase-js";
import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from "../../../bindings";
import { createSupabaseClient } from "../lib/supabase/client";
import {
  CheckResult,
  InitializeCheckerDOPayload,
  MonitorConfig,
} from "../lib/types";
import handleBodyParsing from "../lib/utils";

const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 5;
const FETCH_TIMEOUT_MS = 30 * 1000;
const MAX_DB_RETRIES = 3;
const DB_RETRY_DELAY_BASE_MS = 1000;
const USER_AGENT = "Shamva-Checker/1.0";
const FIRST_CHECK_DELAY_MS = 5000;

export class CheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;
  private readonly doId: string;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.doId = ctx.id.toString();
  }

  private async loadConfig(): Promise<MonitorConfig | null> {
    const config = await this.ctx.storage.get<MonitorConfig>("config");
    if (!config || !config.urlToCheck || !config.monitorId || !config.userId) {
      return null;
    }
    return config;
  }

  private async updateConfig(updates: Partial<MonitorConfig>): Promise<void> {
    const current = await this.loadConfig();
    if (!current) throw new Error("No config to update");

    const merged = { ...current, ...updates };
    await this.ctx.storage.put("config", merged);
  }

  private async initialize(params: InitializeCheckerDOPayload): Promise<void> {
    const {
      urlToCheck,
      monitorId,
      userId,
      intervalMs = DEFAULT_CHECK_INTERVAL_MS,
      method = "GET",
      region,
      headers,
      body,
    } = params;

    if (!urlToCheck || !monitorId || !userId) {
      throw new Error(
        "Invalid parameters: urlToCheck, monitorId, userId required",
      );
    }

    const existingConfig = await this.loadConfig();

    const newConfig: MonitorConfig = {
      urlToCheck,
      monitorId,
      userId,
      method,
      intervalMs,
      region: region ?? null,
      createdAt: existingConfig?.createdAt ?? Date.now(),
      consecutiveFailures: existingConfig?.consecutiveFailures ?? 0,
      headers: headers || undefined,
      body: body || undefined,
      lastStatusCode: existingConfig?.lastStatusCode,
    };

    await this.ctx.storage.put("config", newConfig);

    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.setAlarm(Date.now() + FIRST_CHECK_DELAY_MS);
  }

  private async performCheck(
    urlToCheck: string,
    method: string,
    customHeaders?: Record<string, string>,
    customBody?: Record<string, unknown> | string | null,
  ): Promise<CheckResult> {
    const checkStartTime = performance.now();
    const result: CheckResult = {
      ok: false,
      statusCode: null,
      latencyMs: null,
      headers: null,
      bodyContent: null,
      checkError: null,
      colo: null,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const requestHeaders: HeadersInit = {
        "User-Agent": USER_AGENT,
        ...customHeaders,
      };

      const requestOptions: RequestInit = {
        method,
        redirect: "manual",
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (method === "POST" && customBody) {
        if (typeof customBody === "string") {
          requestOptions.body = customBody;
        } else {
          requestOptions.body = JSON.stringify(customBody);
          if (
            !customHeaders?.["Content-Type"] &&
            !customHeaders?.["content-type"]
          ) {
            (requestOptions.headers as Record<string, string>)["Content-Type"] =
              "application/json";
          }
        }
      }

      const response = await fetch(urlToCheck, requestOptions);

      clearTimeout(timeoutId);

      result.latencyMs = performance.now() - checkStartTime;
      result.ok = response.ok;
      result.statusCode = response.status;
      result.colo = response.cf?.colo ?? null;
      result.headers = Object.fromEntries(response.headers.entries());
      result.bodyContent = await handleBodyParsing(response);
    } catch (error: unknown) {
      result.latencyMs = performance.now() - checkStartTime;
      result.checkError =
        error instanceof Error && error.name === "AbortError"
          ? "Timeout"
          : String(error);
    }

    return result;
  }

  private async processCheckResult(
    result: CheckResult,
  ): Promise<Record<string, string | number | null> | null> {
    const config = await this.loadConfig();
    if (!config) {
      throw new Error("Missing configuration");
    }

    const now = Date.now();
    const isSuccess =
      result.ok === true &&
      result.statusCode !== null &&
      result.statusCode < 400;
    const monitorStatusUpdate: Record<string, string | number | null> = {
      last_check_at: new Date(now).toISOString(),
    };

    let newConsecutiveFailures = config.consecutiveFailures;

    if (isSuccess) {
      if (config.consecutiveFailures > 0) {
        // TODO: notify user about reconnect
        monitorStatusUpdate.status = "active";
        monitorStatusUpdate.error_message = null;
      }
      newConsecutiveFailures = 0;
      monitorStatusUpdate.last_success_at = new Date(now).toISOString();
      if (!monitorStatusUpdate.status) monitorStatusUpdate.status = "active";
    } else {
      newConsecutiveFailures++;
      if (newConsecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
        // TODO: Notify user that the failure threshold has been reached
      }
      monitorStatusUpdate.last_failure_at = new Date(now).toISOString();
      monitorStatusUpdate.status = "error";
      monitorStatusUpdate.error_message =
        result.checkError ?? `HTTP status ${result.statusCode}`;
    }

    await this.updateConfig({
      lastStatusCode: result.statusCode ?? undefined,
      consecutiveFailures: newConsecutiveFailures,
    });

    const hasMeaningfulUpdate = Object.keys(monitorStatusUpdate).some(
      (key) => key !== "last_check_at",
    );
    return hasMeaningfulUpdate ? monitorStatusUpdate : null;
  }

  private async logCheckResult(
    config: MonitorConfig,
    result: CheckResult,
  ): Promise<void> {
    const logData = {
      user_id: config.userId,
      monitor_id: config.monitorId,
      do_id: this.doId,
      url: config.urlToCheck,
      status_code: result.statusCode,
      latency: result.latencyMs,
      headers: result.headers,
      body_content: result.bodyContent,
      error: result.checkError,
      colo: result.colo,
      method: config.method,
      created_at: new Date().toISOString(),
      region: config.region,
    };

    let attempt = 0;
    while (attempt < MAX_DB_RETRIES) {
      attempt++;
      try {
        const { error } = await createSupabaseClient(this.env)
          .from("logs")
          .insert(logData);
        if (error) throw error;
        return;
      } catch (dbError: unknown) {
        if (attempt >= MAX_DB_RETRIES) {
          console.error(
            `DO ${this.doId}: Failed DB log insert after ${attempt} attempts: ${(dbError as PostgrestError)?.message ?? String(dbError)}`,
          );
        } else {
          await new Promise((r) =>
            setTimeout(r, DB_RETRY_DELAY_BASE_MS * 2 ** (attempt - 1)),
          );
        }
      }
    }
  }

  private async updateMonitorStatus(
    monitorId: string,
    updateData: Record<string, string | number | null>,
  ): Promise<void> {
    try {
      const { error } = await createSupabaseClient(this.env)
        .from("monitors")
        .update(updateData)
        .eq("id", monitorId);

      if (error) throw error;
    } catch (error: unknown) {
      console.error(
        `DO ${this.doId}: Failed monitor update ${monitorId}: ${(error as PostgrestError)?.message ?? String(error)}`,
      );
    }
  }

  private async scheduleNextAlarm(intervalMs: number): Promise<void> {
    try {
      console.log("Schedule next alarm");
      await this.ctx.storage.setAlarm(Date.now() + intervalMs);
    } catch (alarmError) {
      console.error(
        `DO ${this.doId}: Failed primary alarm schedule for ${this.doId}:`,
        alarmError,
      );
      const fallbackInterval = Math.max(intervalMs, DEFAULT_CHECK_INTERVAL_MS);
      await this.ctx.storage.setAlarm(Date.now() + fallbackInterval);
      await this.reportCriticalError(
        this.doId,
        `Failed schedule, using fallback. Err: ${alarmError instanceof Error ? alarmError.message : String(alarmError)}`,
      );
    }
  }

  private async reportCriticalError(
    monitorId: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await createSupabaseClient(this.env)
        .from("monitors")
        .update({
          status: "error",
          error_message: `Critical DO Error: ${errorMessage}`,
        })
        .eq("id", monitorId);
    } catch (reportError) {
      console.error(
        `DO ${this.doId}: Failed reporting critical error for ${monitorId}:`,
        reportError,
      );
    }
  }

  private async handleFatalError(
    monitorId: string | null,
    reason: string,
  ): Promise<void> {
    console.error(`DO ${this.doId}: Fatal error (${reason}). Cleaning up.`);
    if (monitorId) {
      await this.reportCriticalError(monitorId, `Disabled: ${reason}`);
    }
    try {
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
    } catch (e) {
      console.error(`DO ${this.doId}: Error during fatal cleanup:`, e);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/initialize") {
      try {
        await this.initialize(await request.json());
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`DO ${this.doId}: Init fetch failed: ${message}`, err);
        return new Response(`Init failed: ${message}`, { status: 400 });
      }
    }

    if (request.method === "DELETE" && url.pathname === "/cleanup") {
      try {
        await this.ctx.storage.deleteAll();
        await this.ctx.storage.deleteAlarm();
        console.log(
          `DO ${this.doId}: Successfully cleaned up and ready for deletion`,
        );
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error(`DO ${this.doId}: Cleanup failed:`, err);
        return new Response(`Cleanup failed: ${err}`, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }

  async alarm(): Promise<void> {
    const config = await this.loadConfig();

    console.log(config);

    if (!config) {
      await this.handleFatalError(null, "Missing critical config");
      return;
    }

    const result = await this.performCheck(
      config.urlToCheck,
      config.method,
      config.headers,
      config.body,
    );

    const monitorStatusUpdate = await this.processCheckResult(result);
    await this.logCheckResult(config, result);

    if (monitorStatusUpdate) {
      await this.updateMonitorStatus(config.monitorId, monitorStatusUpdate);
    }

    await this.scheduleNextAlarm(config.intervalMs);
  }
}
