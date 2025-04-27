import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from "../../../../bindings";
import { createSupabaseClient } from "../supabase/client";

const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;

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

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
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

    await this.ctx.storage.put({
      urlToCheck,
      monitorId,
      userId,
      intervalMs,
      method,
    });

    // fire up the first check
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

    if (!urlToCheck || !monitorId || !userId) {
      console.error(
        `Alarm for DO ${doId}: Missing required data (urlToCheck, monitorId, or userId) in storage. Deleting alarm and state.`,
      );
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
      return;
    }

    console.log(
      `Alarm triggered for DO ${doId}: Checking URL ${urlToCheck} for monitor ${monitorId}`,
    );

    let status: number | null = null;
    let ok: boolean | null = null;
    let latency: number | null = null;
    let headers: Record<string, string> | null = null;
    let bodyContent = null;
    let checkError: string | null = null;
    let colo: string | null = null;
    const checkStartTime = performance.now();

    try {
      const response = await fetch(urlToCheck, {
        redirect: "manual",
        headers: { "User-Agent": "Blinks-Checker/1.0" },
      });

      console.log(response);

      latency = performance.now() - checkStartTime;
      status = response.status;
      ok = response.ok;
      colo = response.cf?.colo ?? null;
      headers = Object.fromEntries(response.headers.entries());

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        bodyContent = await response.json();
      } else {
        const textContent = await response.text();
        const truncatedContent = textContent.slice(0, 10000);
        bodyContent = { _rawContent: truncatedContent };
      }
    } catch (error: unknown) {
      console.error(`Alarm check failed for ${urlToCheck}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      checkError = message;
      status = -1;
      ok = false;
      latency = performance.now() - checkStartTime;
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
    };

    try {
      const supabase = createSupabaseClient(this.env);
      const { error: insertError } = await supabase
        .from("logs")
        .insert(logData);

      if (insertError) {
        console.error(
          `Failed to insert log for monitor ${monitorId}: ${insertError.message}`,
          insertError,
        );
      } else {
        console.log(
          `Log saved for monitor ${monitorId} (Status: ${status}, Latency: ${latency?.toFixed(2)}ms)`,
        );
      }
    } catch (dbError: unknown) {
      console.error(
        `Database operation error inserting log for monitor ${monitorId}:`,
        dbError,
      );
    } finally {
      await this.ctx.storage.setAlarm(Date.now() + intervalMs);
      console.log(`Rescheduled alarm for DO ${doId} in ${intervalMs}ms`);
    }
  }
}
