import { connect } from "cloudflare:sockets";
import { DurableObject } from "cloudflare:workers";
import type { EnvBindings } from "../../../bindings";
import { supabase } from "../lib/supabase/client";
import { CheckResult, Incident, MonitorConfig } from "../lib/types";
import { NotificationService } from "../notifications/notification-service";



export class TcpCheckerDurableObject extends DurableObject {
  ctx: DurableObjectState;
  env: EnvBindings;
  private readonly doId: string;
  private notificationService: NotificationService;

  constructor(ctx: DurableObjectState, env: EnvBindings) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.doId = ctx.id.toString();
    this.notificationService = new NotificationService(env);
  }

  private async performTcpCheck(hostPort: string, timeoutThresholdMs?: number): Promise<CheckResult> {
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
      const [hostname, portStr] = hostPort.split(":");
      const port = parseInt(portStr, 10);

      if (!hostname || !port || port < 1 || port > 65535) {
        throw new Error("Invalid host:port format");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutThresholdMs || 45000);

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

  private async createIncident(
    monitorId: string,
    region: string | null,
    _tcpHostPort: string,
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
    tcpHostPort: string,
    result: CheckResult,
    region: string
  ): Promise<void> {
    const [hostname, portStr] = tcpHostPort.split(":");
    const tcpHost = hostname;
    const tcpPort = parseInt(portStr, 10);

    const logData = {
      workspace_id: workspaceId,
      monitor_id: monitorId,
      url: tcpHostPort,
      status_code: null,
      ok: result.ok,
      latency: result.latencyMs,
      headers: null,
      body_content: null,
      error: result.checkError,
      method: null,
      region: region,
      check_type: "tcp",
      tcp_host: tcpHost,
      tcp_port: tcpPort,
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
    } catch (dbError: unknown) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);
      const errorDetails = dbError instanceof Error ? dbError.stack : undefined;

      console.error(`DO ${this.doId}: Failed to insert log:`, {
        error: errorMessage,
        details: errorDetails,
        monitorId,
        tcpHostPort,
        region,
      });
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/check") {
      try {
        const config = (await request.json()) as MonitorConfig;

        if (!config.tcpHostPort) {
          throw new Error("TCP host:port is required for TCP checks");
        }

        const result = await this.performTcpCheck(config.tcpHostPort, config.timeoutThresholdMs);

        this.ctx.waitUntil(
          this.logCheckResult(
            config.workspaceId,
            config.monitorId,
            config.tcpHostPort,
            result,
            config.region
          )
        );

        const isSuccess = result.ok === true;
        
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
                  config.tcpHostPort,
                  errorMessage
                );

                if (incident) {
                  this.ctx.waitUntil(
                    this.notificationService.notifyError(config.workspaceId, {
                      monitorId: config.monitorId,
                      monitorName: monitor.name,
                      url: monitor.tcp_host_port || config.tcpHostPort,
                      statusCode: undefined,
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
                        url: monitor.tcp_host_port || config.tcpHostPort,
                        statusCode: undefined,
                        errorMessage:
                          result.checkError ?? "TCP connection failed",
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
              const errorMessage = result.checkError ?? "TCP connection failed";

              const incident = await this.createIncident(
                config.monitorId,
                config.region,
                config.tcpHostPort,
                errorMessage
              );

              if (incident) {
                this.ctx.waitUntil(
                  this.notificationService.notifyError(config.workspaceId, {
                    monitorId: config.monitorId,
                    monitorName: monitor.name,
                    url: monitor.tcp_host_port || config.tcpHostPort,
                    statusCode: undefined,
                    errorMessage: result.checkError ?? "TCP connection failed",
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
                error_message: result.checkError ?? "TCP connection failed",
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
