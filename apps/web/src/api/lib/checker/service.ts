import { connect } from "cloudflare:sockets";
import { env as globalEnv } from "cloudflare:workers";
import { ZodError } from "zod";
import { EnvBindings } from "../../../../bindings";
import { NotificationService } from "../../notifications/notification-service";
import { CheckResultSchema, MonitorConfigSchema } from "../schemas";
import { ScreenshotService } from "../screenshot/service";
import { supabase } from "../supabase/client";
import { CheckResult, Incident, Monitor, MonitorConfig } from "../types";
import buildBodyContent from "../utils";

const USER_AGENT = "Shamva-Checker/1.0";

const env = globalEnv as EnvBindings;

export class MonitorCheckService {
  private screenshotService: ScreenshotService;
  private notificationService: NotificationService;

  constructor() {
    this.screenshotService = new ScreenshotService(env);
    this.notificationService = new NotificationService(env);
  }

  async processCheckResult(
    config: MonitorConfig,
    result: CheckResult
  ): Promise<void> {
    try {
      MonitorConfigSchema.parse(config);
      CheckResultSchema.parse(result);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          "Invalid config or result provided to processCheckResult",
          {
            err: error,
            config,
            result,
            validationErrors: error.issues,
          }
        );
        throw new Error(
          `Validation failed: ${error.issues.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }

    const isSuccess =
      result.ok === true &&
      (config.checkType === "tcp" ||
        (result.statusCode !== null && result.statusCode < 400));

    const isDegraded = Boolean(
      result.latencyMs !== null &&
        config.degradedThresholdMs &&
        result.latencyMs > config.degradedThresholdMs
    );

    const now = Date.now();

    try {
      await this.logCheckResult(
        config.workspaceId,
        config.monitorId,
        config.checkType,
        config.urlToCheck,
        config.tcpHostPort || null,
        result,
        config.method || null,
        config.region
      );

      const { data: monitor, error: monitorError } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", config.monitorId)
        .single();

      if (monitorError) {
        console.error("Failed to fetch monitor data", {
          err: monitorError,
          monitorId: config.monitorId,
        });
        return;
      }

      const { data: activeIncidents, error: incidentError } = await supabase
        .from("incidents")
        .select("*")
        .eq("monitor_id", config.monitorId)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (incidentError) {
        console.error("Failed to fetch active incidents", {
          err: incidentError,
          monitorId: config.monitorId,
        });
        return;
      }

      const activeIncident = activeIncidents?.[0];

      if (isSuccess) {
        await this.handleSuccessfulCheck(
          config,
          result,
          monitor,
          activeIncident,
          isDegraded,
          now
        );
      } else {
        await this.handleFailedCheck(
          config,
          result,
          monitor,
          activeIncident,
          now
        );
      }
    } catch (error) {
      console.error("Failed to process check result", {
        err: error,
        monitorId: config.monitorId,
        region: config.region,
      });
    }
  }

  private async handleSuccessfulCheck(
    config: MonitorConfig,
    result: CheckResult,
    monitor: Monitor,
    activeIncident: Incident | undefined,
    isDegraded: boolean,
    now: number
  ): Promise<void> {
    if (isDegraded) {
      if (!activeIncident) {
        const errorMessage = `Response time ${result.latencyMs}ms exceeds degraded threshold ${config.degradedThresholdMs}ms`;
        const incident = await this.createIncident(
          config.monitorId,
          config.region,
          config.checkType,
          config.urlToCheck,
          errorMessage
        );

        if (incident) {
          await this.notificationService.notifyError(config.workspaceId, {
            monitorId: config.monitorId,
            monitorName: monitor.name,
            url:
              monitor.url || monitor.tcp_host_port || config.urlToCheck || "",
            statusCode: result.statusCode ?? undefined,
            errorMessage,
            lastChecked: new Date(now).toISOString(),
            region: config.region || "Unknown",
          });

          await this.updateIncident(incident.id, {
            notified_at: new Date().toISOString(),
          });
        }
      } else {
        const updatedRegions = [
          ...new Set([...activeIncident.regions_affected, config.region]),
        ];
        await this.updateIncident(activeIncident.id, {
          regions_affected: updatedRegions,
        });
      }
    } else {
      if (activeIncident) {
        const updatedRegions = activeIncident.regions_affected.filter(
          (region: string) => region !== config.region
        );

        if (updatedRegions.length === 0) {
          await this.resolveIncident(
            activeIncident,
            config,
            monitor,
            result,
            now
          );
        } else {
          await this.updateIncident(activeIncident.id, {
            regions_affected: updatedRegions,
          });
        }
      }
    }

    await this.updateMonitor(config.monitorId, {
      status: isDegraded ? "degraded" : "active",
      error_message:
        isDegraded && config.degradedThresholdMs
          ? `Response time ${result.latencyMs}ms exceeds degraded threshold ${config.degradedThresholdMs}ms`
          : null,
      last_check_at: new Date(now).toISOString(),
      last_success_at: new Date(now).toISOString(),
    });
  }

  private async handleFailedCheck(
    config: MonitorConfig,
    result: CheckResult,
    monitor: Monitor,
    activeIncident: Incident | undefined,
    now: number
  ): Promise<void> {
    const errorMessage =
      result.checkError ??
      (config.checkType === "tcp"
        ? "TCP connection failed"
        : `HTTP status ${result.statusCode}`);

    if (!activeIncident) {
      const incident = await this.createIncident(
        config.monitorId,
        config.region,
        config.checkType,
        config.urlToCheck,
        errorMessage
      );

      if (incident) {
        await this.notificationService.notifyError(config.workspaceId, {
          monitorId: config.monitorId,
          monitorName: monitor.name,
          url: monitor.url || monitor.tcp_host_port || config.urlToCheck || "",
          statusCode: result.statusCode ?? undefined,
          errorMessage,
          lastChecked: new Date(now).toISOString(),
          region: config.region || "Unknown",
        });

        await this.updateIncident(incident.id, {
          notified_at: new Date().toISOString(),
        });
      }
    } else {
      const updatedRegions = [
        ...new Set([...activeIncident.regions_affected, config.region]),
      ];
      await this.updateIncident(activeIncident.id, {
        regions_affected: updatedRegions,
      });
    }

    const affectedRegions = activeIncident?.regions_affected.length || 1;
    const totalRegions = monitor.regions.length;
    const newStatus = affectedRegions === totalRegions ? "error" : "degraded";

    await this.updateMonitor(config.monitorId, {
      status: newStatus,
      error_message: errorMessage,
      last_check_at: new Date(now).toISOString(),
      last_failure_at: new Date(now).toISOString(),
    });
  }

  private async resolveIncident(
    incident: Incident,
    config: MonitorConfig,
    monitor: Monitor,
    result: CheckResult,
    now: number
  ): Promise<void> {
    await this.updateIncident(incident.id, {
      resolved_at: new Date(now).toISOString(),
      downtime_duration_ms: now - new Date(incident.started_at).getTime(),
    });

    await this.notificationService.notifyRecovery(
      config.workspaceId,
      {
        monitorId: config.monitorId,
        monitorName: monitor.name,
        url: monitor.url || monitor.tcp_host_port || config.urlToCheck || "",
        statusCode: result.statusCode ?? undefined,
        errorMessage:
          result.checkError ??
          (config.checkType === "tcp"
            ? "TCP connection failed"
            : `HTTP status ${result.statusCode}`),
        lastChecked: new Date(now).toISOString(),
        region: config.region || "Unknown",
      },
      new Date(incident.started_at).toISOString()
    );
  }

  async performHttpCheck(
    urlToCheck: string | null,
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
    if (!urlToCheck || typeof urlToCheck !== "string") {
      throw new Error("Valid URL is required for HTTP check");
    }

    if (method && !["GET", "POST", "HEAD"].includes(method)) {
      throw new Error("Method must be one of GET, POST, HEAD");
    }

    const result = await this.performHttpCheckInternal(
      urlToCheck,
      method,
      customHeaders,
      customBody,
      timeoutThresholdMs
    );

    try {
      return CheckResultSchema.parse(result);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("HTTP check result validation failed", {
          err: error,
          result,
          validationErrors: error.issues,
        });
      }
      return result;
    }
  }

  async performTcpCheck(
    hostPort: string | null,
    timeoutThresholdMs?: number
  ): Promise<CheckResult> {
    if (!hostPort || typeof hostPort !== "string") {
      throw new Error("Valid host:port is required for TCP check");
    }

    if (!/^[a-zA-Z0-9.-]+:\d+$/.test(hostPort)) {
      throw new Error(
        "Invalid host:port format. Expected format: hostname:port"
      );
    }

    const [, portStr] = hostPort.split(":");
    const port = parseInt(portStr, 10);

    if (port < 1 || port > 65535) {
      throw new Error("Port must be between 1 and 65535");
    }

    const result = await this.performTcpCheckInternal(
      hostPort,
      timeoutThresholdMs
    );

    try {
      return CheckResultSchema.parse(result);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("TCP check result validation failed", {
          err: error,
          result,
          validationErrors: error.issues,
        });
      }
      return result;
    }
  }

  private async performHttpCheckInternal(
    urlToCheck: string | null,
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

    if (!urlToCheck) {
      result.checkError = "URL is required for HTTP check";
      return result;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        timeoutThresholdMs || 45000
      );

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

  private async performTcpCheckInternal(
    hostPort: string | null,
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

    if (!hostPort) {
      result.checkError = "Host:port is required for TCP check";
      return result;
    }

    try {
      const [hostname, portStr] = hostPort.split(":");
      const port = parseInt(portStr, 10);

      if (!hostname || !port || port < 1 || port > 65535) {
        throw new Error("Invalid host:port format");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        timeoutThresholdMs || 45000
      );

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

  private async logCheckResult(
    workspaceId: string,
    monitorId: string,
    checkType: "http" | "tcp",
    url: string | null,
    tcpHostPort: string | null,
    result: CheckResult,
    method: string | null,
    region: string
  ): Promise<void> {
    let tcpHost = null;
    let tcpPort = null;

    if (checkType === "tcp" && tcpHostPort) {
      const [hostname, portStr] = tcpHostPort.split(":");
      tcpHost = hostname;
      tcpPort = parseInt(portStr, 10);
    }

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
      check_type: checkType,
      tcp_host: tcpHost,
      tcp_port: tcpPort,
    };

    try {
      const { error } = await supabase.from("logs").insert(logData).select();

      if (error) {
        throw error;
      }
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);
      const errorDetails = dbError instanceof Error ? dbError.stack : undefined;

      console.error("Failed to log check result to database", {
        err: dbError,
        monitorId,
        workspaceId,
        region,
        checkType,
        errorMessage,
        errorDetails,
      });
    }
  }

  private async createIncident(
    monitorId: string,
    region: string | null,
    checkType: "http" | "tcp",
    url: string | null,
    errorMessage?: string | null
  ): Promise<Incident | null> {
    try {
      const { data: existingIncident } = await supabase
        .from("incidents")
        .select("*")
        .eq("monitor_id", monitorId)
        .eq("error_message", errorMessage || null)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingIncident) {
        const updatedRegions = [
          ...new Set(
            [...existingIncident.regions_affected, region].filter(Boolean)
          ),
        ];

        if (updatedRegions.length > existingIncident.regions_affected.length) {
          await this.updateIncident(existingIncident.id, {
            regions_affected: updatedRegions,
          });
        }

        return existingIncident;
      }

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
      // improve error handling

      if (incident && checkType === "http" && url) {
        try {
          const screenshotUrl =
            await this.screenshotService.takeAndStoreScreenshot(
              url,
              incident.id
            );
          if (screenshotUrl) {
            await this.updateIncident(incident.id, {
              screenshot_url: screenshotUrl,
            });
          }
        } catch (screenshotError) {
          console.error("Failed to take screenshot for incident", {
            err: screenshotError,
            incidentId: incident.id,
            url,
          });
        }
      }

      return incident;
    } catch (error) {
      console.error("Failed to create incident", {
        err: error,
        monitorId,
        region,
        checkType,
        errorMessage,
      });
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
      console.error("Failed to update incident", {
        err: error,
        incidentId,
        updates,
      });
    }
  }

  private async updateMonitor(
    monitorId: string,
    updates: Partial<Monitor>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("monitors")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", monitorId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update monitor", {
        err: error,
        monitorId,
        updates,
      });
    }
  }
}
