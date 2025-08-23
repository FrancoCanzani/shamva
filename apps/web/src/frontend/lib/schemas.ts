import z from "zod";

const isValidJSON = (val?: string) => {
  if (!val?.trim()) return true;
  try {
    JSON.parse(val);
    return true;
  } catch {
    return false;
  }
};

const isValidJSONObject = (val?: string) => {
  if (!val?.trim()) return true;
  try {
    const parsed = JSON.parse(val);
    return (
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    );
  } catch {
    return false;
  }
};

export const HttpMonitorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Monitor name cannot be empty")
      .max(100, "Monitor name is too long"),
    url: z
      .string()
      .trim()
      .min(1, "URL is required")
      .refine((val) => z.url().safeParse(val).success, {
        error: "Invalid URL format",
      }),
    method: z.enum(["GET", "POST", "HEAD"], {
      error: "Please select a valid HTTP method",
    }),
    interval: z
      .number()
      .int()
      .min(60000, "Interval must be at least 1 minute")
      .max(3600000, "Interval must be less than 1 hour"),
    regions: z
      .array(z.string())
      .min(1, "Please select at least one monitoring region"),
    headersString: z
      .string()
      .trim()
      .optional()
      .refine(
        isValidJSONObject,
        'Headers must be a valid JSON object string, e.g. {"key": "value"}'
      ),
    bodyString: z
      .string()
      .trim()
      .optional()
      .refine(
        isValidJSON,
        'Body must be a valid JSON string, e.g. {"key": "value"} or "text"'
      ),
    slackWebhookUrl: z.string().trim().optional(),
    enableHeartbeat: z.boolean().optional(),
    heartbeatId: z.string().trim().optional(),
    heartbeatTimeoutSeconds: z.number().int().min(30).max(3600).optional(),
    degradedThresholdMs: z
      .number()
      .int()
      .min(1000, "Degraded threshold must be at least 1 second")
      .max(300000, "Degraded threshold cannot exceed 5 minutes")
      .optional(),
    timeoutThresholdMs: z
      .number()
      .int()
      .min(1000, "Timeout threshold must be at least 1 second")
      .max(600000, "Timeout threshold cannot exceed 10 minutes")
      .optional(),
  })
  .refine(
    (data) => {
      // Only validate if both thresholds are provided
      if (data.timeoutThresholdMs && data.degradedThresholdMs) {
        return data.timeoutThresholdMs > data.degradedThresholdMs;
      }
      return true;
    },
    {
      error: "Timeout threshold must be greater than degraded threshold",
      path: ["timeoutThresholdMs"],
    }
  );

export const TcpMonitorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Monitor name cannot be empty")
      .max(100, "Monitor name is too long"),
    tcpHostPort: z
      .string()
      .trim()
      .min(1, "Host:Port is required")
      .regex(
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*:[1-9]\d{0,4}$/,
        "Please enter a valid host:port format (e.g., example.com:8080)"
      ),
    interval: z
      .number()
      .int()
      .min(60000, "Interval must be at least 1 minute")
      .max(3600000, "Interval must be less than 1 hour"),
    regions: z
      .array(z.string())
      .min(1, "Please select at least one monitoring region"),
    slackWebhookUrl: z.string().trim().optional(),
    enableHeartbeat: z.boolean().optional(),
    heartbeatId: z.string().trim().optional(),
    heartbeatTimeoutSeconds: z.number().int().min(30).max(3600).optional(),
    degradedThresholdMs: z
      .number()
      .int()
      .min(1000, "Degraded threshold must be at least 1 second")
      .max(300000, "Degraded threshold cannot exceed 5 minutes")
      .optional(),
    timeoutThresholdMs: z
      .number()
      .int()
      .min(1000, "Timeout threshold must be at least 1 second")
      .max(600000, "Timeout threshold cannot exceed 10 minutes")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.timeoutThresholdMs && data.degradedThresholdMs) {
        return data.timeoutThresholdMs > data.degradedThresholdMs;
      }
      return true;
    },
    {
      error: "Timeout threshold must be greater than degraded threshold",
      path: ["timeoutThresholdMs"],
    }
  );

export const MemberInviteSchema = z.object({
  email: z
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  role: z.enum(["admin", "member", "viewer"], {
    error: "Please select a valid role",
  }),
});

export const WorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Workspace name must be URL-friendly (lowercase letters, numbers, and hyphens, no leading/trailing/consecutive hyphens)"
    ),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  members: z.array(MemberInviteSchema),
});

export const StatusPageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be URL-friendly (lowercase letters, numbers, and hyphens, no leading/trailing/consecutive hyphens)"
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  showValues: z.boolean().default(true),
  password: z
    .string()
    .max(100, "Password cannot exceed 100 characters")
    .optional(),
  isPublic: z.boolean().default(true),
  monitors: z.array(z.string()).min(1, "Please select at least one monitor"),
});

export const HeartbeatSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Heartbeat name cannot be empty")
    .max(100, "Heartbeat name is too long"),
  expectedLapseMs: z.number().positive(),
  gracePeriodMs: z.number().positive(),
  workspaceId: z.uuid("Invalid workspace ID format"),
  pingId: z.uuid("Invalid ID format"),
});

export const IncidentUpdateSchema = z.object({
  acknowledgedAt: z.iso.datetime().optional(),
  resolvedAt: z.iso.datetime().optional(),
  postMortem: z
    .string()
    .max(2000, "Post-mortem cannot exceed 2000 characters")
    .optional(),
});
