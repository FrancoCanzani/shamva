import { z } from "@hono/zod-openapi";

export const IncidentSchema = z.object({
  id: z.string(),
  monitor_id: z.string(),
  workspace_id: z.string(),
  started_at: z.string(),
  notified_at: z.string().nullable(),
  acknowledged_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  screenshot_url: z.string().nullable(),
  post_mortem: z.string().nullable(),
  downtime_duration_ms: z.number().nullable(),
  regions_affected: z.array(z.string()).nullable(),
  error_message: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const IncidentUpdateSchema = z.object({
  id: z.string().optional(),
  incident_id: z.string().optional(),
  content: z.string().min(1).max(2000).optional(),
  created_at: z.string().optional(),
  author_id: z.string().nullable().optional(),
  author_name: z.string().nullable().optional(),
  author_email: z.string().email().nullable().optional(),
  acknowledged_at: z.iso.datetime().optional(),
  resolved_at: z.iso.datetime().optional(),
  post_mortem: z
    .string()
    .max(100000, "Post-mortem cannot exceed 100000 characters")
    .optional(),
});
