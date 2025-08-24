import { BodyContentSchema } from "../../../lib/schemas";
import z from "zod";

export const LogSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  monitor_id: z.string().nullable(),
  heartbeat_id: z.string().nullable().optional(),
  url: z.string(),
  status_code: z.number(),
  region: z.string(),
  latency: z.number(),
  created_at: z.string(),
  headers: z.record(z.string(), z.string()).nullable(),
  body_content: BodyContentSchema.nullable(),
  error: z.string().nullable(),
  method: z.string(),
  check_type: z.enum(["http", "tcp", "heartbeat"]),
  tcp_host: z.string().optional(),
  tcp_port: z.number().optional(),
  ok: z.boolean(),
});
