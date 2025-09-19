import { z } from "zod";

export const BodyContentSchema = z.object({
  raw: z.string().nullable(),
  truncated: z.boolean(),
  parsed: z.record(z.string(), z.unknown()).nullable().optional(),
  contentType: z.string().nullable().optional(),
  parseError: z.string().nullable().optional(),
});

export const MonitorConfigSchema = z
  .object({
    checkType: z.enum(["http", "tcp"]),
    urlToCheck: z.url().nullable(),
    tcpHostPort: z
      .string()
      .regex(/^[a-zA-Z0-9.-]+:\d+$/)
      .nullable()
      .optional(),
    monitorId: z.uuid(),
    workspaceId: z.uuid(),
    method: z.enum(["GET", "POST", "HEAD"]).optional(),
    intervalMs: z.number().positive().min(30000),
    region: z.string().min(1),
    createdAt: z.number().positive(),
    consecutiveFailures: z.number().min(0),
    lastStatusCode: z.number().int().min(100).max(599).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    body: z
      .union([z.string(), z.record(z.string(), z.unknown()), z.null()])
      .optional(),
    degradedThresholdMs: z.number().positive().optional(),
    timeoutThresholdMs: z.number().positive().min(1000).max(300000).optional(),
  })
  .refine(
    (data) => {
      if (data.checkType === "http") {
        return !!data.urlToCheck;
      }
      if (data.checkType === "tcp") {
        return !!data.tcpHostPort;
      }
      return true;
    },
    {
      message:
        "urlToCheck is required for HTTP checks, tcpHostPort is required for TCP checks",
    }
  );

export const CheckResultSchema = z.object({
  ok: z.boolean(),
  statusCode: z.number().int().min(100).max(599).nullable(),
  latencyMs: z.number().positive().nullable(),
  headers: z.record(z.string(), z.string()).nullable(),
  bodyContent: BodyContentSchema.nullable(),
  checkError: z.string().nullable(),
});
