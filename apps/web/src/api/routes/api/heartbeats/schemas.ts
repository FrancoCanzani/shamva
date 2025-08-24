import { z } from "@hono/zod-openapi";

export const UUIDParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const HeartbeatBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  expectedLapseMs: z.number().positive(),
  gracePeriodMs: z.number().positive(),
  workspaceId: z.uuid(),
  pingId: z.uuid(),
});

export const HeartbeatSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  ping_id: z.string(),
  name: z.string(),
  expected_lapse_ms: z.number(),
  grace_period_ms: z.number(),
  status: z.string().nullable(),
  last_beat_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});
