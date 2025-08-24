import { z } from "@hono/zod-openapi";

export const PublicMetricsBodySchema = z.object({
  timestamp: z.string().openapi({ example: new Date().toISOString() }),
  hostname: z.string().min(1),
  platform: z.string().min(1),
  cpu_percent: z.number().min(0).max(100),
  load_avg_1: z.number().min(0),
  memory_percent: z.number().min(0).max(100),
  memory_used_gb: z.number().min(0),
  memory_total_gb: z.number().min(0),
  disk_percent: z.number().min(0).max(100),
  disk_free_gb: z.number().min(0),
  disk_total_gb: z.number().min(0),
  network_sent_mb: z.number().min(0),
  network_recv_mb: z.number().min(0),
  network_sent_mbps: z.number().min(0),
  network_recv_mbps: z.number().min(0),
  top_process_name: z.string().nullable(),
  top_process_cpu: z.number().nullable(),
  total_processes: z.number().int().min(0),
  temperature_celsius: z.number().nullable(),
  power_status: z.string().nullable(),
  battery_percent: z.number().min(0).max(100).nullable(),
  network_connected: z.boolean(),
  network_interface: z.string().nullable(),
  uptime_seconds: z.number().min(0),
});

export const PublicMetricsResponseSchema = z.object({
  data: z.object({
    agent: z.object({
      id: z.string(),
      name: z.string(),
    }),
    timestamp: z.string(),
    hostname: z.string(),
  }),
  success: z.literal(true),
  error: z.null(),
});

export const AuthorizationHeaderSchema = z.object({
  authorization: z.string().openapi({ example: "Bearer <agent_token>" }),
});
