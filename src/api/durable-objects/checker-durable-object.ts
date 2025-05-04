import { PostgrestError } from "@supabase/supabase-js";
import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from "../../../bindings";
import { createSupabaseClient } from "../lib/supabase/client";
import { InitializeCheckerDOPayload } from "../lib/types";
import handleBodyParsing from "../lib/utils";

const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 5;
const MAX_COOLDOWN_INTERVAL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 30 * 1000;
const MAX_DB_RETRIES = 3;
const DB_RETRY_DELAY_BASE_MS = 1000;
const USER_AGENT = "Blinks-Checker/1.0";

interface MonitorState {
  urlToCheck: string;
  monitorId: string;
  userId: string;
  method: string | "GET";
  intervalMs: number;
  region: string | null;
  createdAt: number;
  consecutiveFailures: number;
  lastStatusCode?: number;
}

interface CheckResult {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  headers: Record<string, string> | null;
  bodyContent: any;
  checkError: string | null;
  colo: string | null;
}

export class CheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;

  private readonly doId: string;
  private consecutiveFailures: number = 0;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;

    this.doId = ctx.id.toString();
    this.consecutiveFailures = 0;
  }

  private async loadAndSyncState(): Promise<MonitorState | null> {
    const [
      urlToCheck,
      monitorId,
      userId,
      method,
      intervalMs,
      region,
      createdAt,
      consecutiveFailures,
      lastStatusCode,
    ] = await Promise.all([
      this.ctx.storage.get<string>("urlToCheck"),
      this.ctx.storage.get<string>("monitorId"),
      this.ctx.storage.get<string>("userId"),
      this.ctx.storage.get<string>("method"),
      this.ctx.storage.get<number>("intervalMs"),
      this.ctx.storage.get<string>("region"),
      this.ctx.storage.get<number>("createdAt"),
      this.ctx.storage.get<number>("consecutiveFailures"),
      this.ctx.storage.get<number>("lastStatusCode"),
    ]);

    if (!urlToCheck || !monitorId || !userId || !createdAt) {
      console.error(`DO ${this.doId}: Missing critical configuration.`);
      return null;
    }

    this.consecutiveFailures = consecutiveFailures ?? 0;

    return {
      urlToCheck,
      monitorId,
      userId,
      method: method || "GET",
      intervalMs: intervalMs ?? DEFAULT_CHECK_INTERVAL_MS,
      region: region ?? null,
      createdAt,
      consecutiveFailures: this.consecutiveFailures,
      lastStatusCode: lastStatusCode,
    };
  }

  private async initialize(params: InitializeCheckerDOPayload): Promise<void> {
    const {
      urlToCheck,
      monitorId,
      userId,
      intervalMs = DEFAULT_CHECK_INTERVAL_MS,
      method = "GET",
      region,
    } = params;

    if (!urlToCheck || !monitorId || !userId) {
      throw new Error(
        "Invalid parameters: urlToCheck, monitorId, userId required",
      );
    }

    const existingUrl = await this.ctx.storage.get<string>("urlToCheck");
    if (existingUrl) {
      if ((await this.ctx.storage.getAlarm()) === null) {
        const nextAlarmTime =
          Date.now() +
          ((await this.ctx.storage.get<number>("intervalMs")) ??
            DEFAULT_CHECK_INTERVAL_MS);
        await this.ctx.storage.setAlarm(nextAlarmTime);
      }
      return;
    }

    const now = Date.now();
    this.consecutiveFailures = 0;

    await this.ctx.storage.put({
      urlToCheck,
      monitorId,
      userId,
      intervalMs,
      method,
      createdAt: now,
      consecutiveFailures: this.consecutiveFailures,
      region: region ?? null,
    });

    const firstAlarmTime = now + 5000;
    await this.ctx.storage.setAlarm(firstAlarmTime);
  }

  private async performCheck(
    urlToCheck: string,
    method: string,
  ): Promise<CheckResult> {
    const checkStartTime = performance.now();
    let ok: boolean = false,
      statusCode: number | null = null,
      latencyMs: number | null = null;
    let headers: Record<string, string> | null = null,
      bodyContent: any = null,
      checkError: string | null = null,
      colo: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(urlToCheck, {
        method,
        redirect: "manual",
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      latencyMs = performance.now() - checkStartTime;

      ok = response.ok;
      statusCode = response.status;
      colo = response.cf?.colo ?? null;
      headers = Object.fromEntries(response.headers.entries());
      bodyContent = await handleBodyParsing(response);
    } catch (error: unknown) {
      latencyMs = performance.now() - checkStartTime;
      ok = false;
      statusCode = null;
      checkError =
        error instanceof Error && error.name === "AbortError"
          ? "Timeout"
          : String(error);
    }
    return {
      ok,
      statusCode,
      latencyMs,
      headers,
      bodyContent,
      checkError,
      colo,
    };
  }

  private async processCheckResult(
    result: CheckResult,
  ): Promise<Record<string, any> | null> {
    const now = Date.now();
    const isSuccess =
      result.ok === true &&
      result.statusCode !== null &&
      result.statusCode < 400;
    /* eslint "@typescript-eslint/no-explicit-any": "off" */
    const monitorStatusUpdate: Record<string, any> = {
      last_check_at: new Date(now).toISOString(),
    };

    if (isSuccess) {
      if (this.consecutiveFailures > 0) {
        // TODO: Notify user that the monitor has recovered.
        monitorStatusUpdate.status = "active";
        monitorStatusUpdate.error_message = null;
      }
      this.consecutiveFailures = 0;
      monitorStatusUpdate.last_success_at = new Date(now).toISOString();
      if (!monitorStatusUpdate.status) monitorStatusUpdate.status = "active";
    } else {
      this.consecutiveFailures++;
      if (this.consecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
        // TODO: Notify user that the failure threshold has been reached.
      }
      monitorStatusUpdate.last_failure_at = new Date(now).toISOString();
      monitorStatusUpdate.status = "error";
      monitorStatusUpdate.error_message =
        result.checkError ?? `HTTP status ${result.statusCode}`;
    }

    await this.ctx.storage.put({
      lastStatusCode: result.statusCode ?? undefined,
      consecutiveFailures: this.consecutiveFailures,
    });

    const hasMeaningfulUpdate = Object.keys(monitorStatusUpdate).some(
      (key) => key !== "last_check_at",
    );
    return hasMeaningfulUpdate ? monitorStatusUpdate : null;
  }

  private async logCheckResult(
    state: MonitorState,
    result: CheckResult,
  ): Promise<void> {
    const logData = {
      user_id: state.userId,
      monitor_id: state.monitorId,
      do_id: this.doId,
      url: state.urlToCheck,
      status_code: result.statusCode,
      latency: result.latencyMs,
      headers: result.headers,
      body_content: result.bodyContent,
      error: result.checkError,
      colo: result.colo,
      method: state.method,
      created_at: new Date().toISOString(),
      region: state.region,
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
          // TODO: Potentially notify admin/system about persistent DB logging issues.
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
    updateData: Record<string, any>,
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

  private async scheduleNextAlarm(
    monitorId: string,
    intervalMs: number,
  ): Promise<void> {
    const nextAlarmTime = Date.now() + intervalMs;
    try {
      await this.ctx.storage.setAlarm(nextAlarmTime);
    } catch (alarmError) {
      console.error(
        `DO ${this.doId}: Failed primary alarm schedule for ${monitorId}:`,
        alarmError,
      );
      try {
        const fallbackTime = Date.now() + DEFAULT_CHECK_INTERVAL_MS;
        await this.ctx.storage.setAlarm(fallbackTime);
        await this.reportCriticalError(
          monitorId,
          `Failed schedule, using fallback. Err: ${alarmError instanceof Error ? alarmError.message : String(alarmError)}`,
        );
      } catch (fallbackError) {
        console.error(
          `DO ${this.doId}: CRITICAL - Failed fallback alarm schedule for ${monitorId}:`,
          fallbackError,
        );
        // TODO: Notify admin/system immediately
        await this.reportCriticalError(
          monitorId,
          `CRITICAL: Failed fallback schedule. Err: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
        );
      }
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
      // TODO: Notify user that their monitor is being disabled due to internal error.
      await this.reportCriticalError(monitorId, `Disabled: ${reason}`);
    } else {
      // TODO: Notify admin/system about an orphaned/broken DO.
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
        // TODO: Notify user of initialization failure
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
    const state = await this.loadAndSyncState();
    if (!state) {
      await this.handleFatalError(
        (await this.ctx.storage.get<string>("monitorId")) ?? null,
        "Missing critical config",
      );
      return;
    }

    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.warn(
        `DO ${this.doId}: Monitor ${state.monitorId} entering cooldown after ${this.consecutiveFailures} failures.`,
      );
      await this.updateMonitorStatus(state.monitorId, {
        status: "error",
        error_message: `${this.consecutiveFailures} failures. Cooldown active.`,
        last_check_at: new Date().toISOString(),
      });
      const cooldownInterval = Math.min(
        state.intervalMs * 3,
        MAX_COOLDOWN_INTERVAL_MS,
      );
      await this.scheduleNextAlarm(state.monitorId, cooldownInterval);
      return;
    }

    const result = await this.performCheck(state.urlToCheck, state.method);
    const monitorStatusUpdate = await this.processCheckResult(result);
    await this.logCheckResult(state, result);

    if (monitorStatusUpdate) {
      await this.updateMonitorStatus(state.monitorId, monitorStatusUpdate);
    }

    await this.scheduleNextAlarm(state.monitorId, state.intervalMs);
  }
}
