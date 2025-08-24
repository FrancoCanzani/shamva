import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../../bindings";
import type { ApiVariables } from "../../../../lib/types";
import {
  PublicMetricsBodySchema,
  PublicMetricsResponseSchema,
} from "./schemas";
import { supabase } from "../../../../lib/supabase/client";
import { openApiErrorResponses } from "../../../../lib/utils";

const route = createRoute({
  method: "post",
  path: "/public/metrics",
  request: {
    headers: z.object({
      authorization: z.string().openapi({ example: "Bearer <agent_token>" }),
    }),
    body: {
      content: { "application/json": { schema: PublicMetricsBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Metrics stored",
      content: { "application/json": { schema: PublicMetricsResponseSchema } },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPostMetrics(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(
          {
            data: null,
            success: false,
            error: "Missing or invalid Authorization header",
          },
          401
        );
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return c.json(
          {
            data: null,
            success: false,
            error: "Missing agent token",
          },
          401
        );
      }

      const { data: agent, error: agentError } = await supabase
        .from("collectors")
        .select("id, name, workspace_id, is_active")
        .eq("token", token)
        .eq("is_active", true)
        .single();

      if (agentError || !agent) {
        return c.json(
          {
            data: null,
            success: false,
            error: "Invalid or inactive agent token",
          },
          401
        );
      }

      const body = await c.req.json().catch(() => null);
      if (!body) {
        return c.json(
          {
            data: null,
            success: false,
            error: "Invalid JSON body",
          },
          400
        );
      }

      const validation = PublicMetricsBodySchema.safeParse(body);
      if (!validation.success) {
        const error = z.prettifyError(validation.error);
        return c.json(
          {
            data: null,
            success: false,
            error: "Validation failed",
            details: error,
          },
          400
        );
      }

      const metrics = validation.data;

      await supabase
        .from("collector_agents")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", agent.id);

      const { error: metricsError } = await supabase.from("metrics").insert({
        collector_id: agent.id,
        workspace_id: agent.workspace_id,
        timestamp: metrics.timestamp,
        hostname: metrics.hostname,
        platform: metrics.platform,
        cpu_percent: metrics.cpu_percent,
        load_avg_1: metrics.load_avg_1,
        memory_percent: metrics.memory_percent,
        memory_used_gb: metrics.memory_used_gb,
        memory_total_gb: metrics.memory_total_gb,
        disk_percent: metrics.disk_percent,
        disk_free_gb: metrics.disk_free_gb,
        disk_total_gb: metrics.disk_total_gb,
        network_sent_mb: metrics.network_sent_mb,
        network_recv_mb: metrics.network_recv_mb,
        network_sent_mbps: metrics.network_sent_mbps,
        network_recv_mbps: metrics.network_recv_mbps,
        top_process_name: metrics.top_process_name,
        top_process_cpu: metrics.top_process_cpu,
        total_processes: metrics.total_processes,
        temperature_celsius: metrics.temperature_celsius,
        power_status: metrics.power_status,
        battery_percent: metrics.battery_percent,
        network_connected: metrics.network_connected,
        network_interface: metrics.network_interface,
        uptime_seconds: metrics.uptime_seconds,
        created_at: new Date().toISOString(),
      });

      if (metricsError) {
        console.error("Failed to store metrics:", metricsError);
        return c.json(
          {
            data: null,
            success: false,
            error: "Failed to store metrics data",
            details: metricsError.message,
          },
          500
        );
      }

      return c.json({
        data: {
          agent: { id: agent.id, name: agent.name },
          timestamp: metrics.timestamp,
          hostname: metrics.hostname,
        },
        success: true,
        error: null,
      });
    } catch (error) {
      const errorDetails =
        error instanceof Error ? error.message : String(error);
      return c.json(
        {
          data: null,
          success: false,
          error: "Internal server error",
          details: errorDetails,
        },
        500
      );
    }
  });
}
