import { DurableObject } from "cloudflare:workers";
import { EnvBindings } from "../../../bindings";
import { createSupabaseClient } from "./supabase/client";

const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;

export class CheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
  }

  async initialize(params: {
    urlToCheck: string;
    monitorId: string;
    userId: string;
    intervalMs?: number;
  }): Promise<{ success: boolean }> {
    const {
      urlToCheck,
      monitorId,
      userId,
      intervalMs = DEFAULT_CHECK_INTERVAL_MS,
    } = params;

    if (!urlToCheck || !monitorId || !userId) {
      throw new Error(
        "Invalid parameters: urlToCheck, monitorId, userId required",
      );
    }

    const storageData = {
      urlToCheck,
      monitorId,
      userId,
      intervalMs,
    };

    await this.ctx.storage.put(storageData);

    // Set first alarm to run in 5 seconds
    const firstAlarmTime = Date.now() + 5000;
    await this.ctx.storage.setAlarm(firstAlarmTime);

    console.log(
      `DO ${this.ctx.id.toString()} initialized for monitor ${monitorId}. Interval: ${intervalMs}ms. First alarm at ${new Date(firstAlarmTime).toISOString()}`,
    );

    return { success: true };
  }

  async alarm() {
    const urlToCheck = await this.ctx.storage.get<string>("urlToCheck");
    const monitorId = await this.ctx.storage.get<string>("monitorId");
    const userId = await this.ctx.storage.get<string>("userId");

    const intervalMs =
      (await this.ctx.storage.get<number>("intervalMs")) ??
      DEFAULT_CHECK_INTERVAL_MS;
    const doId = this.ctx.id.toString();

    if (!urlToCheck || !monitorId || !userId) {
      console.error(
        `Alarm for DO ${doId}: Missing required data. Deleting alarm.`,
      );
      await this.ctx.storage.deleteAll();
      return;
    }

    console.log(`Alarm checking URL: ${urlToCheck} for monitor ${monitorId}`);

    try {
      const start = performance.now();
      const response = await fetch(urlToCheck, {
        redirect: "manual",
        headers: { "User-Agent": "Blinks-Checker/1.0" },
      });
      const latency = performance.now() - start;
      const status = response.status;
      const ok = response.ok;

      const logData = {
        user_id: userId,
        monitor_id: monitorId,
        do_id: doId,
        url: urlToCheck,
        status,
        ok,
        latency,
      };

      const supabase = createSupabaseClient(this.env);
      const { error: insertError } = await supabase
        .from("logs")
        .insert(logData);

      if (insertError) {
        console.error(`Failed to insert log:`, insertError);
      } else {
        console.log(`Log saved for monitor ${monitorId}`);
      }
    } catch (error) {
      console.error(`Alarm check failed:`, error);
    } finally {
      await this.ctx.storage.setAlarm(Date.now() + intervalMs);
      console.log(`Rescheduled alarm in ${intervalMs}ms`);
    }
  }
}
