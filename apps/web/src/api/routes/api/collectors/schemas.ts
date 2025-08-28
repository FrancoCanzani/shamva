import { z } from "@hono/zod-openapi";

export const UUIDParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const WorkspaceQuerySchema = z.object({
  workspaceId: z.uuid().openapi({
    param: { name: "workspaceId", in: "query" },
    example: "a81bc81b-dead-4e5d-abff-90865d1e13b1",
  }),
});

export const CollectorBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  workspaceId: z.uuid(),
  token: z.string().trim().min(1).max(255),
});

export const CollectorUpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const CollectorSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  workspace_id: z.string(),
  is_active: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional(),
});

export const MetricSchema = z.object({
  id: z.string(),
  collector_id: z.string(),
  workspace_id: z.string(),
  timestamp: z.string(),
  hostname: z.string(),
  platform: z.string(),
  cpu_percent: z.number(),
  load_avg_1: z.number(),
  memory_percent: z.number(),
  memory_used_gb: z.number(),
  memory_total_gb: z.number(),
  disk_percent: z.number(),
  disk_free_gb: z.number(),
  disk_total_gb: z.number(),
  network_sent_mb: z.number(),
  network_recv_mb: z.number(),
  network_sent_mbps: z.number(),
  network_recv_mbps: z.number(),
  network_connected: z.boolean(),
  network_interface: z.string(),
  top_process_name: z.string(),
  top_process_cpu: z.number(),
  total_processes: z.number(),
  temperature_celsius: z.number(),
  power_status: z.string(),
  battery_percent: z.number(),
  uptime_seconds: z.number(),
  created_at: z.string(),
});

export const CollectorWithLastMetricSchema = CollectorSchema.extend({
  metrics: z.array(MetricSchema).optional(),
});
