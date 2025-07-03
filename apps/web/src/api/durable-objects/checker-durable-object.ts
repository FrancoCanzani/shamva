import { SupabaseClient } from "@supabase/supabase-js";
import { DurableObject } from "cloudflare:workers";
import { connect } from "cloudflare:sockets";
import type { EnvBindings } from "../../../bindings";
import { EmailService } from "../notifications/email/service";
import { ScreenshotService } from "../lib/screenshot/service";
import { SlackService } from "../notifications/slack/service";
import { createSupabaseClient } from "../lib/supabase/client";
import {
  CheckResult,
  Incident,
  MonitorConfig,
  MonitorEmailData,
} from "../lib/types";
import handleBodyParsing from "../lib/utils";

const FETCH_TIMEOUT_MS = 30 * 1000;
const TCP_TIMEOUT_MS = 10 * 1000;
const USER_AGENT = "Shamva-Checker/1.0";

export class CheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;
  private readonly doId: string;
  private emailService: EmailService;
  private slackService: SlackService;
  private screenshotService: ScreenshotService;
  private supabase: SupabaseClient;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.doId = ctx.id.toString();
    this.emailService = new EmailService(env);
    this.slackService = new SlackService();
    this.screenshotService = new ScreenshotService(env);
    this.supabase = createSupabaseClient(env);
  }

  private async performTcpCheck(hostPort: string): Promise<CheckResult> {
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
      const [hostname, portStr] = hostPort.split(":");
      const port = parseInt(portStr, 10);

      if (!hostname || !port || port < 1 || port > 65535) {
        throw new Error("Invalid host:port format");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TCP_TIMEOUT_MS);

      const socket = connect({ hostname, port });
      
      await socket.opened;
      clearTimeout(timeoutId);

      result.latencyMs = performance.now() - checkStartTime;
      result.ok = true;

      socket.close();
    } catch (error: unknown) {
      result.latencyMs = performance.now() - checkStartTime;
      result.checkError =
        error instanceof Error && error.name === "AbortError"
          ? "TCP connection timeout"
          : String(error);
    }

    return result;
  }

  private async performHttpCheck(
    urlToCheck: string,
    method?: string,
    customHeaders?: Record<string, string>,
    customBody?: string | URLSearchParams | FormData | null
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
        method: method || "GET",
        redirect: "manual",
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (method === "POST" && customBody) {
        requestOptions.body = customBody;
        if (
          !customHeaders?.["Content-Type"] &&
          !customHeaders?.["content-type"] &&
          typeof customBody === "string"
        ) {
          (requestOptions.headers as Record<string, string>)["Content-Type"] =
            "application/json";
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

  private async createIncident(
    monitorId: string,
    region: string | null,
    url: string,
    checkType?: "http" | "tcp"
  ): Promise<Incident | null> {
    try {
      const { data: incident, error } = await this.supabase
        .from("incidents")
        .insert({
          monitor_id: monitorId,
          started_at: new Date().toISOString(),
          regions_affected: region ? [region] : [],
        })
        .select()
        .single();

      if (error) throw error;

      if (incident) {
        if (checkType !== "tcp") {
          const screenshotUrl =
            await this.screenshotService.takeAndStoreScreenshot(url, incident.id);
          if (screenshotUrl) {
            await this.updateIncident(incident.id, {
              screenshot_url: screenshotUrl,
            });
          }
        }
      }

      return incident;
    } catch (error) {
      console.error(`DO ${this.doId}: Failed to create incident:`, error);
      return null;
    }
  }

  private async updateIncident(
    incidentId: string,
    updates: Partial<Incident>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
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

  private async sendNotifications(
    emailData: MonitorEmailData,
    isRecovery: boolean,
    userEmails: string[],
    slackWebhookUrl?: string
  ): Promise<boolean> {
    if (this.env.NAME === "development") {
      return true;
    }

    try {
      const notificationPromises = [
        isRecovery
          ? this.emailService.sendMonitorRecoveredAlert(
              emailData,
              emailData.lastChecked,
              userEmails
            )
          : this.emailService.sendMonitorDownAlert(emailData, userEmails),
      ];

      if (slackWebhookUrl) {
        notificationPromises.push(
          isRecovery
            ? this.slackService.sendMonitorRecoveredAlert(
                emailData,
                emailData.lastChecked,
                slackWebhookUrl
              )
            : this.slackService.sendMonitorDownAlert(emailData, slackWebhookUrl)
        );
      }

      const results = await Promise.all(notificationPromises);
      return results.some((success) => success);
    } catch (error) {
      console.error(`DO ${this.doId}: Failed to send notification:`, error);
      return false;
    }
  }

  private async logCheckResult(
    monitorId: string,
    url: string,
    result: CheckResult,
    method: string | null,
    region: string,
    checkType?: "http" | "tcp",
    tcpHostPort?: string
  ): Promise<void> {
    let tcpHost: string | undefined;
    let tcpPort: number | undefined;
    
    if (checkType === "tcp" && tcpHostPort) {
      const [hostname, portStr] = tcpHostPort.split(":");
      tcpHost = hostname;
      tcpPort = parseInt(portStr, 10);
    }

    const logData = {
      monitor_id: monitorId,
      url,
      status_code: result.statusCode,
      ok: result.ok,
      latency: result.latencyMs,
      headers: result.headers,
      body_content: result.bodyContent,
      error: result.checkError,
      method: method,
      region: region,
      check_type: checkType,
      colo: result.colo,
      tcp_host: tcpHost,
      tcp_port: tcpPort,
    };

    try {
      const { error } = await this.supabase
        .from("logs")
        .insert(logData)
        .select();

      if (error) {
        console.error(`DO ${this.doId}: Database error inserting log:`, {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
    } catch (dbError: unknown) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);
      const errorDetails = dbError instanceof Error ? dbError.stack : undefined;

      console.error(`DO ${this.doId}: Failed to insert log:`, {
        error: errorMessage,
        details: errorDetails,
        monitorId,
        url,
        method,
        region,
      });
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/check") {
      try {
        const { userEmails, ...config } =
          (await request.json()) as MonitorConfig & { userEmails: string[] };
        
        let result: CheckResult;
        
        if (config.checkType === "tcp" && config.tcpHostPort) {
          result = await this.performTcpCheck(config.tcpHostPort);
        } else {
          result = await this.performHttpCheck(
            config.urlToCheck,
            config.method,
            config.headers,
            config.body
          );
        }

        const targetUrl = config.checkType === "tcp" ? config.tcpHostPort! : config.urlToCheck;
        
        await this.logCheckResult(
          config.monitorId,
          targetUrl,
          result,
          config.method || null,
          config.region,
          config.checkType,
          config.tcpHostPort
        );

        const isSuccess = config.checkType === "tcp" 
          ? result.ok === true  // For TCP, only check if connection was successful
          : result.ok === true && result.statusCode !== null && result.statusCode < 400; // For HTTP, check status code too
        const now = Date.now();

        if (isSuccess) {
          const { data: activeIncident } = await this.supabase
            .from("incidents")
            .select("*")
            .eq("monitor_id", config.monitorId)
            .is("resolved_at", null)
            .single();

          if (activeIncident) {
            // Get monitor with its regions
            const { data: monitor } = await this.supabase
              .from("monitors")
              .select("regions")
              .eq("id", config.monitorId)
              .single();

            // Check if all regions are now healthy by checking if all regions in the incident are resolved
            const allRegionsHealthy = monitor?.regions.every(
              (region: string) =>
                !activeIncident.regions_affected.includes(region)
            );

            if (allRegionsHealthy) {
              await this.updateIncident(activeIncident.id, {
                resolved_at: new Date(now).toISOString(),
                downtime_duration_ms:
                  now - new Date(activeIncident.started_at).getTime(),
              });

              const { data: monitor } = await this.supabase
                .from("monitors")
                .select("*")
                .eq("id", config.monitorId)
                .single();

              if (monitor) {
                const emailData: MonitorEmailData = {
                  monitorId: config.monitorId,
                  monitorName: monitor.name,
                  url: monitor.url || monitor.tcp_host_port || targetUrl,
                  statusCode: result.statusCode ?? undefined,
                  errorMessage: config.checkType === "tcp" 
                    ? result.checkError ?? "TCP connection failed"
                    : result.checkError ?? `HTTP status ${result.statusCode}`,
                  lastChecked: new Date(now).toISOString(),
                  region: config.region || "Unknown",
                };

                await this.sendNotifications(
                  emailData,
                  true,
                  userEmails,
                  monitor.slack_webhook_url
                );
              }
            }
          }

          await this.supabase
            .from("monitors")
            .update({
              status: "active",
              error_message: null,
              last_check_at: new Date(now).toISOString(),
              last_success_at: new Date(now).toISOString(),
              updated_at: new Date(now).toISOString(),
            })
            .eq("id", config.monitorId);
        } else {
          const { data: monitor } = await this.supabase
            .from("monitors")
            .select("*")
            .eq("id", config.monitorId)
            .single();

          if (monitor) {
            const { data: activeIncident } = await this.supabase
              .from("incidents")
              .select("*")
              .eq("monitor_id", config.monitorId)
              .is("resolved_at", null)
              .single();

            if (!activeIncident) {
              const incident = await this.createIncident(
                config.monitorId,
                config.region,
                targetUrl,
                config.checkType
              );

              if (incident) {
                const emailData: MonitorEmailData = {
                  monitorId: config.monitorId,
                  monitorName: monitor.name,
                  url: monitor.url || monitor.tcp_host_port || targetUrl,
                  statusCode: result.statusCode ?? undefined,
                  errorMessage: config.checkType === "tcp" 
                    ? result.checkError ?? "TCP connection failed"
                    : result.checkError ?? `HTTP status ${result.statusCode}`,
                  lastChecked: new Date(now).toISOString(),
                  region: config.region || "Unknown",
                };

                const notificationSuccess = await this.sendNotifications(
                  emailData,
                  false,
                  userEmails,
                  monitor.slack_webhook_url
                );

                if (notificationSuccess) {
                  await this.updateIncident(incident.id, {
                    notified_at: new Date(now).toISOString(),
                  });
                }
              }
            } else {
              // Update the regions_affected array in the incident
              const updatedRegions = [
                ...new Set([...activeIncident.regions_affected, config.region]),
              ];
              await this.updateIncident(activeIncident.id, {
                regions_affected: updatedRegions,
              });
            }

            // Set monitor status based on number of affected regions
            const affectedRegions =
              activeIncident?.regions_affected.length || 1;
            const totalRegions = monitor.regions.length;
            const newStatus =
              affectedRegions === totalRegions ? "error" : "degraded";

            await this.supabase
              .from("monitors")
              .update({
                status: newStatus,
                error_message: config.checkType === "tcp"
                  ? result.checkError ?? "TCP connection failed"
                  : result.checkError ?? `HTTP status ${result.statusCode}`,
                last_check_at: new Date(now).toISOString(),
                last_failure_at: new Date(now).toISOString(),
                updated_at: new Date(now).toISOString(),
              })
              .eq("id", config.monitorId);
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`DO ${this.doId}: Check failed: ${message}`, err);
        return new Response(
          JSON.stringify({
            success: false,
            error: message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
