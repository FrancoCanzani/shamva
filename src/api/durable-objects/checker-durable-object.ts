import { PostgrestError } from "@supabase/supabase-js";
import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from "../../../bindings";
import { createSupabaseClient } from "../lib/supabase/client";
import { EmailService } from "../lib/email/service";
import { SlackService } from "../lib/slack/service";
import {
  CheckResult,
  InitializeCheckerDOPayload,
  MonitorConfig,
  Incident,
  MonitorEmailData,
} from "../lib/types";
import handleBodyParsing from "../lib/utils";

const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 3;
const FETCH_TIMEOUT_MS = 30 * 1000;
const USER_AGENT = "Shamva-Checker/1.0";
const FIRST_CHECK_DELAY_MS = 5000;

export class CheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;
  private readonly doId: string;
  private emailService: EmailService;
  private slackService: SlackService;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.doId = ctx.id.toString();
    this.emailService = new EmailService(env);
    this.slackService = new SlackService(env);
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
    await this.ctx.blockConcurrencyWhile(async () => {
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
    });
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

  private async checkMonitorExists(
    monitorId: string,
  ): Promise<{ exists: boolean; status?: string }> {
    try {
      const { data: monitor, error } = await createSupabaseClient(this.env)
        .from("monitors")
        .select("id, status")
        .eq("id", monitorId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return { exists: false };
        }
        throw error;
      }

      return { exists: true, status: monitor.status };
    } catch (error) {
      console.error(`DO ${this.doId}: DB validation attempt failed:`, error);
    }

    throw new Error("Max retry attempts exceeded");
  }

  private async createIncident(
    monitorId: string,
    workspaceId: string,
    region: string | null,
  ): Promise<Incident | null> {
    try {
      const { data: incident, error } = await createSupabaseClient(this.env)
        .from("incidents")
        .insert({
          monitor_id: monitorId,
          workspace_id: workspaceId,
          started_at: new Date().toISOString(),
          regions_affected: region ? [region] : [],
        })
        .select()
        .single();

      if (error) throw error;
      return incident;
    } catch (error) {
      console.error(`DO ${this.doId}: Failed to create incident:`, error);
      return null;
    }
  }

  private async updateIncident(
    incidentId: string,
    updates: Partial<Incident>,
  ): Promise<void> {
    try {
      const { error } = await createSupabaseClient(this.env)
        .from("incidents")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", incidentId);

      if (error) throw error;
    } catch (error) {
      console.error(`DO ${this.doId}: Failed to update incident:`, error);
    }
  }

  private async sendIncidentNotification(
    incident: Incident,
    monitorName: string,
    errorMessage: string,
    statusCode: number | null,
    url: string,
    userEmail: string,
    userName: string,
    slackWebhookUrl?: string,
  ): Promise<void> {
    if (this.env.NAME === "development") {
      console.log("Skipping notification in development environment");
      return;
    }

    try {
      const emailData: MonitorEmailData = {
        monitorId: incident.monitor_id,
        monitorName,
        url,
        userEmail,
        userName,
        statusCode: statusCode ?? undefined,
        errorMessage,
        lastChecked: new Date().toISOString(),
        region: incident.regions_affected[0] || "Unknown",
      };

      const notificationPromises = [this.emailService.sendMonitorDownAlert(emailData)];
      
      if (slackWebhookUrl) {
        notificationPromises.push(this.slackService.sendMonitorDownAlert(emailData, slackWebhookUrl));
      }

      const results = await Promise.all(notificationPromises);
      
      if (results.some(success => success)) {
        await this.updateIncident(incident.id, {
          notified_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`DO ${this.doId}: Failed to send notification:`, error);
    }
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
        // Check if there's an active incident to resolve
        const { data: activeIncident } = await createSupabaseClient(this.env)
          .from("incidents")
          .select("*")
          .eq("monitor_id", config.monitorId)
          .is("resolved_at", null)
          .single();

        if (activeIncident) {
          // Update the incident with resolution
          await this.updateIncident(activeIncident.id, {
            resolved_at: new Date().toISOString(),
            downtime_duration_ms: now - new Date(activeIncident.started_at).getTime(),
          });

          // Send recovery notification
          const { data: monitor } = await createSupabaseClient(this.env)
            .from("monitors")
            .select("name, url, user_email, user_name, slack_webhook_url")
            .eq("id", config.monitorId)
            .single();

          if (monitor) {
            const emailData: MonitorEmailData = {
              monitorId: config.monitorId,
              monitorName: monitor.name,
              url: monitor.url,
              userEmail: monitor.user_email,
              userName: monitor.user_name,
              statusCode: result.statusCode ?? undefined,
              errorMessage: undefined,
              lastChecked: new Date().toISOString(),
              region: result.colo || "Unknown",
            };

            const notificationPromises = [
              this.emailService.sendMonitorRecoveredAlert(
                emailData,
                monitorStatusUpdate.last_success_at as string
              ),
            ];

            if (monitor.slack_webhook_url) {
              notificationPromises.push(
                this.slackService.sendMonitorRecoveredAlert(
                  emailData,
                  monitorStatusUpdate.last_success_at as string,
                  monitor.slack_webhook_url
                )
              );
            }

            await Promise.all(notificationPromises);
          }
        }

        monitorStatusUpdate.status = "active";
        monitorStatusUpdate.error_message = null;
      }
      newConsecutiveFailures = 0;
      monitorStatusUpdate.last_success_at = new Date(now).toISOString();
      if (!monitorStatusUpdate.status) monitorStatusUpdate.status = "active";
    } else {
      newConsecutiveFailures++;
      
      if (newConsecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
        // Check if there's already an active incident
        const { data: activeIncident } = await createSupabaseClient(this.env)
          .from("incidents")
          .select("*")
          .eq("monitor_id", config.monitorId)
          .is("resolved_at", null)
          .single();

        if (activeIncident) {
          // Update existing incident with new region
          if (result.colo && !activeIncident.regions_affected.includes(result.colo)) {
            await this.updateIncident(activeIncident.id, {
              regions_affected: [...activeIncident.regions_affected, result.colo],
            });
          }
        } else {
          // Create new incident only if there isn't an active one
          const { data: monitor } = await createSupabaseClient(this.env)
            .from("monitors")
            .select("name, workspace_id, url, user_email, user_name")
            .eq("id", config.monitorId)
            .single();

          if (monitor) {
            const incident = await this.createIncident(
              config.monitorId,
              monitor.workspace_id,
              result.colo
            );

            if (incident) {
              await this.sendIncidentNotification(
                incident,
                monitor.name,
                result.checkError ?? `HTTP status ${result.statusCode}`,
                result.statusCode,
                monitor.url,
                monitor.user_email,
                monitor.user_name
              );
            }
          }
        }
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

    try {
      const { error } = await createSupabaseClient(this.env)
        .from("logs")
        .insert(logData);

      if (error) throw error;
    } catch (dbError: unknown) {
      console.error(
        `DO ${this.doId}: Failed DB log insert: ${(dbError as PostgrestError)?.message ?? String(dbError)}`,
      );
    }
  }

  private async updateMonitorStatus(
    monitorId: string,
    updateData: Record<string, string | number | null>,
  ): Promise<boolean> {
    try {
      const { error } = await createSupabaseClient(this.env)
        .from("monitors")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", monitorId);

      if (error) throw error;
      return true;
    } catch (error: unknown) {
      console.error(
        `DO ${this.doId}: Failed monitor update ${monitorId}: ${(error as PostgrestError)?.message ?? String(error)}`,
      );
      return false;
    }
  }

  private async scheduleNextAlarm(intervalMs: number): Promise<void> {
    try {
      await this.ctx.storage.setAlarm(Date.now() + intervalMs);
    } catch (alarmError) {
      console.error(
        `DO ${this.doId}: Failed primary alarm schedule:`,
        alarmError,
      );

      const fallbackInterval = Math.max(intervalMs, DEFAULT_CHECK_INTERVAL_MS);
      try {
        await this.ctx.storage.setAlarm(Date.now() + fallbackInterval);
      } catch (fallbackError) {
        console.error(
          `DO ${this.doId}: Failed fallback alarm schedule:`,
          fallbackError,
        );
        await this.handleFatalError(
          null,
          `Failed to schedule alarm: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
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
          updated_at: new Date().toISOString(),
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
        return new Response(
          JSON.stringify({
            success: false,
            error: message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
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
        return new Response(
          JSON.stringify({
            success: false,
            error: String(err),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  }

  async alarm(): Promise<void> {
    const config = await this.loadConfig();

    if (!config) {
      await this.handleFatalError(null, "Missing critical config");
      return;
    }

    try {
      const validation = await this.checkMonitorExists(config.monitorId);

      if (!validation.exists) {
        console.log(
          `DO ${this.doId}: Monitor ${config.monitorId} no longer exists in database. Cleaning up.`,
        );
        await this.handleFatalError(null, "Monitor deleted from database");
        return;
      }

      if (
        validation.status === "disabled" ||
        validation.status === "inactive"
      ) {
        return;
      }
    } catch (dbError) {
      console.error(
        `DO ${this.doId}: Failed to validate monitor existence: `,
        dbError,
      );
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
      const updateSuccess = await this.updateMonitorStatus(
        config.monitorId,
        monitorStatusUpdate,
      );
      if (!updateSuccess) {
        console.warn(
          `DO ${this.doId}: Failed to update monitor status, but continuing`,
        );
      }
    }

    await this.scheduleNextAlarm(config.intervalMs);
  }
}
