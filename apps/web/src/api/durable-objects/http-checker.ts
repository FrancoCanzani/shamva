import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from "../../../bindings";
import { ScreenshotService } from "../lib/screenshot/service";
import { supabase } from "../lib/supabase/client";
import { CheckResult, Incident, MonitorConfig } from "../lib/types";
import buildBodyContent from "../lib/utils";
import { NotificationService } from "../notifications/notification-service";

const USER_AGENT = "Shamva-Checker/1.0";

export class HttpCheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;
  private readonly doId: string;
  private screenshotService: ScreenshotService;
  private notificationService: NotificationService;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.doId = ctx.id.toString();
    this.screenshotService = new ScreenshotService(env);
    this.notificationService = new NotificationService(env);
  }

  private async performHttpCheck(
    urlToCheck: string,
    method?: string,
    customHeaders?: Record<string, string>,
    customBody?:
      | string
      | URLSearchParams
      | FormData
      | Record<string, unknown>
      | null,
    timeoutThresholdMs?: number
  ): Promise<CheckResult> {
    const checkStartTime = performance.now();
    const result: CheckResult = {
      ok: false,
      statusCode: null,
      latencyMs: null,
      headers: null,
      bodyContent: null,
      checkError: null,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutThresholdMs || 45000);

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
        const hasExplicitContentType = Boolean(
          customHeaders?.["Content-Type"] || customHeaders?.["content-type"]
        );
        if (
          typeof customBody === "string" ||
          customBody instanceof URLSearchParams ||
          customBody instanceof FormData
        ) {
          requestOptions.body = customBody;
        } else {
          requestOptions.body = JSON.stringify(customBody);
          if (!hasExplicitContentType) {
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
      result.headers = Object.fromEntries(response.headers.entries());
      const contentType = response.headers.get("content-type");
      const text = await response.text();
      result.bodyContent = buildBodyContent(text, contentType);
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
    errorMessage?: string | null
  ): Promise<Incident | null> {
    try {
      const { data: incident, error } = await supabase
        .from("incidents")
        .insert({
          monitor_id: monitorId,
          started_at: new Date().toISOString(),
          regions_affected: region ? [region] : [],
          error_message: errorMessage || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (incident) {
        try {
          const screenshotUrl =
            await this.screenshotService.takeAndStoreScreenshot(url, incident.id);
          if (screenshotUrl) {
            await this.updateIncident(incident.id, {
              screenshot_url: screenshotUrl,
            });
          }
        } catch (screenshotError) {
          console.error(`DO ${this.doId}: Failed to take screenshot:`, screenshotError);
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
      const { error } = await supabase
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

  private async logCheckResult(
    workspaceId: string,
    monitorId: string,
    url: string,
    result: CheckResult,
    method: string | null,
    region: string
  ): Promise<void> {
    const logData = {
      workspace_id: workspaceId,
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
      check_type: "http",
      tcp_host: null,
      tcp_port: null,
    };

    try {
      const { error } = await supabase
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
    } catch (dbError) {
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
        const config = (await request.json()) as MonitorConfig;

        const result = await this.performHttpCheck(
          config.urlToCheck,
          config.method,
          config.headers,
          config.body,
          config.timeoutThresholdMs
        );

        this.ctx.waitUntil(
          this.logCheckResult(
            config.workspaceId,
            config.monitorId,
            config.urlToCheck,
            result,
            config.method || null,
            config.region
          )
        );

        const isSuccess =
          result.ok === true &&
          result.statusCode !== null &&
          result.statusCode < 400;
        
        // Determine if degraded based on latency and threshold
        const isDegraded = result.latencyMs !== null && 
          config.degradedThresholdMs && 
          result.latencyMs > config.degradedThresholdMs;
        
        const now = Date.now();

        if (isSuccess) {
          const { data: monitor } = await supabase
            .from("monitors")
            .select("*")
            .eq("id", config.monitorId)
            .single();

          if (monitor) {
            const { data: activeIncidents, error: incidentError } =
              await supabase
                .from("incidents")
                .select("*")
                .eq("monitor_id", config.monitorId)
                .is("resolved_at", null)
                .order("created_at", { ascending: false })
                .limit(1);

            const activeIncident = activeIncidents?.[0];

            if (incidentError) {
              console.error(
                `DO ${this.doId}: Error fetching active incident:`,
                incidentError
              );
            } else if (isDegraded) {
              // Handle degraded status
              if (!activeIncident) {
                // Create new incident for degradation
                const errorMessage = `Response time ${result.latencyMs}ms exceeds degraded threshold ${config.degradedThresholdMs}ms`;
                const incident = await this.createIncident(
                  config.monitorId,
                  config.region,
                  config.urlToCheck,
                  errorMessage
                );

                if (incident) {
                  this.ctx.waitUntil(
                    this.notificationService.notifyError(config.workspaceId, {
                      monitorId: config.monitorId,
                      monitorName: monitor.name,
                      url: monitor.url || config.urlToCheck,
                      statusCode: result.statusCode ?? undefined,
                      errorMessage,
                      lastChecked: new Date(now).toISOString(),
                      region: config.region || "Unknown",
                    })
                  );

                  this.ctx.waitUntil(
                    this.updateIncident(incident.id, {
                      notified_at: new Date().toISOString(),
                    })
                  );
                }
              } else {
                // Update existing incident with new region
                const updatedRegions = [
                  ...new Set([...activeIncident.regions_affected, config.region]),
                ];
                this.ctx.waitUntil(
                  this.updateIncident(activeIncident.id, {
                    regions_affected: updatedRegions,
                  })
                );
              }
            } else {
              // Monitor is healthy, resolve any active incidents
              if (activeIncident) {
                const allRegionsHealthy = monitor.regions.every(
                  (region: string) =>
                    !activeIncident.regions_affected.includes(region)
                );

                if (allRegionsHealthy) {
                  this.ctx.waitUntil(
                    this.updateIncident(activeIncident.id, {
                      resolved_at: new Date(now).toISOString(),
                      downtime_duration_ms:
                        now - new Date(activeIncident.started_at).getTime(),
                    })
                  );

                  this.ctx.waitUntil(
                    this.notificationService.notifyRecovery(
                      config.workspaceId,
                      {
                        monitorId: config.monitorId,
                        monitorName: monitor.name,
                        url: monitor.url || config.urlToCheck,
                        statusCode: result.statusCode ?? undefined,
                        errorMessage:
                          result.checkError ?? `HTTP status ${result.statusCode}`,
                        lastChecked: new Date(now).toISOString(),
                        region: config.region || "Unknown",
                      },
                      new Date(activeIncident.started_at).toISOString()
                    )
                  );
                }
              }
            }
          }

          await supabase
            .from("monitors")
            .update({
              status: isDegraded ? "degraded" : "active",
              error_message: isDegraded && config.degradedThresholdMs ? `Response time ${result.latencyMs}ms exceeds degraded threshold ${config.degradedThresholdMs}ms` : null,
              last_check_at: new Date(now).toISOString(),
              last_success_at: new Date(now).toISOString(),
              updated_at: new Date(now).toISOString(),
            })
            .eq("id", config.monitorId);
        } else {
          const { data: monitor } = await supabase
            .from("monitors")
            .select("*")
            .eq("id", config.monitorId)
            .single();

          if (monitor) {
            const { data: activeIncidents, error: incidentError } =
              await supabase
                .from("incidents")
                .select("*")
                .eq("monitor_id", config.monitorId)
                .is("resolved_at", null)
                .order("created_at", { ascending: false })
                .limit(1);

            const activeIncident = activeIncidents?.[0];

            console.log(
              `DO ${this.doId}: Monitor ${config.monitorId} check result:`,
              {
                monitorId: config.monitorId,
                region: config.region,
                isSuccess,
                activeIncident: activeIncident?.id,
                activeIncidentResolvedAt: activeIncident?.resolved_at,
                incidentError: incidentError?.code,
                errorMessage: incidentError?.message,
              }
            );

            if (incidentError) {
              console.error(
                `DO ${this.doId}: Error fetching active incident:`,
                incidentError
              );
            } else if (!activeIncident) {
              const errorMessage =
                result.checkError ?? `HTTP status ${result.statusCode}`;

              const incident = await this.createIncident(
                config.monitorId,
                config.region,
                config.urlToCheck,
                errorMessage
              );

              if (incident) {
                this.ctx.waitUntil(
                  this.notificationService.notifyError(config.workspaceId, {
                    monitorId: config.monitorId,
                    monitorName: monitor.name,
                    url: monitor.url || config.urlToCheck,
                    statusCode: result.statusCode ?? undefined,
                    errorMessage:
                      result.checkError ?? `HTTP status ${result.statusCode}`,
                    lastChecked: new Date(now).toISOString(),
                    region: config.region || "Unknown",
                  })
                );

                this.ctx.waitUntil(
                  this.updateIncident(incident.id, {
                    notified_at: new Date().toISOString(),
                  })
                );
              }
            } else if (activeIncident) {
              const updatedRegions = [
                ...new Set([...activeIncident.regions_affected, config.region]),
              ];
              this.ctx.waitUntil(
                this.updateIncident(activeIncident.id, {
                  regions_affected: updatedRegions,
                })
              );
            }

            const affectedRegions =
              activeIncident?.regions_affected.length || 1;
            const totalRegions = monitor.regions.length;
            const newStatus =
              affectedRegions === totalRegions ? "error" : "degraded";

            await supabase
              .from("monitors")
              .update({
                status: newStatus,
                error_message:
                  result.checkError ?? `HTTP status ${result.statusCode}`,
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
