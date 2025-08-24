import { z } from "@hono/zod-openapi";

export const UUIDParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const MonitorSchema = z.object({
  id: z.uuid(),
  workspace_id: z.uuid(),
  check_type: z.enum(["http", "tcp"]),
  url: z.string().nullable(),
  tcp_host_port: z.string().nullable(),
  method: z.enum(["GET", "POST", "HEAD"]).nullable(),
  interval: z.number(),
  regions: z.array(z.string()),
  headers: z.record(z.string(), z.string()).nullable(),
  body: z.union([z.record(z.string(), z.unknown()), z.string(), z.null()]),
  created_at: z.string(),
  updated_at: z.string(),
  last_check_at: z.string().nullable(),
  last_success_at: z.string().nullable(),
  last_failure_at: z.string().nullable(),
  status: z.enum([
    "broken",
    "active",
    "maintenance",
    "paused",
    "error",
    "degraded",
  ]),
  error_message: z.string().nullable(),
  name: z.string(),
  degraded_threshold_ms: z.number(),
  timeout_threshold_ms: z.number(),
});

export const RegionEnum = z.enum([
  "wnam",
  "enam",
  "sam",
  "weur",
  "eeur",
  "apac",
  "oc",
  "afr",
  "me",
]);

const HeadersRecord = z.record(z.string(), z.string());

export const MonitorBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  checkType: z.enum(["http", "tcp"]).optional(),
  url: z.url().optional(),
  tcpHostPort: z.string().optional(),
  method: z.enum(["GET", "POST", "HEAD"]).optional(),
  interval: z.number().int().min(60000).max(3600000).optional(),
  regions: z.array(z.string()).min(1).optional(),
  headersString: z.string().optional(),
  bodyString: z.string().optional(),
  headers: HeadersRecord.optional(),
  body: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
});

export const MonitorCreateBodySchema = MonitorBodySchema.extend({
  name: z.string().min(1).max(100),
  checkType: z.enum(["http", "tcp"]),
  regions: z.array(z.string()).min(1),
  workspaceId: z.uuid(),
  degradedThresholdMs: z.number().int().min(1000).max(300000).optional(),
  timeoutThresholdMs: z.number().int().min(1000).max(600000).optional(),
})
  .refine(
    (data) => (data.checkType === "http" ? !!data.url && !!data.method : true),
    { message: "URL and method are required for HTTP monitors", path: ["url"] }
  )
  .refine((data) => (data.checkType === "tcp" ? !!data.tcpHostPort : true), {
    message: "tcpHostPort is required for TCP monitors",
    path: ["tcpHostPort"],
  });
