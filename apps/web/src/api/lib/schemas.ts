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

export const MonitorsParamsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Monitor name cannot be empty")
      .max(100, "Monitor name is too long"),
    checkType: z.enum(["http", "tcp"]),
    url: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .refine((val) => !val || z.string().url().safeParse(val).success, {
        message: "Invalid URL format",
      }),
    tcpHostPort: z
      .string()
      .trim()
      .regex(
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*:[1-9]\d{0,4}$/,
        "Please enter a valid host:port format (e.g., example.com:8080)"
      )
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    method: z.enum(["GET", "POST", "HEAD"]).optional(),
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
    headers: z.record(z.string()).optional(),
    body: z.union([z.record(z.unknown()), z.string()]).optional(),
    slackWebhookUrl: z.string().trim().optional(),
    heartbeatId: z.string().trim().optional(),
    heartbeatTimeoutSeconds: z.number().int().min(30).max(3600).optional(),
    workspaceId: z.string().uuid("Invalid workspace ID format"),
  })
  .refine(
    (data) => {
      if (data.checkType === "http" && (!data.url || data.url.trim() === "")) {
        return false;
      }
      if (
        data.checkType === "tcp" &&
        (!data.tcpHostPort || data.tcpHostPort.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "URL is required for HTTP checks, Host:Port is required for TCP checks",
      path: ["url"],
    }
  )
  .refine(
    (data) => {
      if (data.checkType === "http" && !data.method) {
        return false;
      }
      return true;
    },
    {
      message: "Method is required for HTTP checks",
      path: ["method"],
    }
  );

export const PartialMonitorSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name too long")
      .optional(),
    check_type: z.enum(["http", "tcp"]).optional(),
    url: z.string().url("Invalid URL format").nullable().optional(),
    tcp_host_port: z.string().nullable().optional(),
    method: z.enum(["GET", "POST", "HEAD"]).nullable().optional(),
    interval: z
      .number()
      .min(60000, "Interval must be at least 1 minute (60000ms)")
      .max(3600000, "Interval cannot exceed 1 hour (3600000ms)")
      .optional(),
    regions: z
      .array(z.string())
      .min(1, "At least one region is required")
      .optional(),
    headers: z.record(z.string(), z.string()).nullable().optional(),
    body: z
      .union([z.record(z.string(), z.unknown()), z.string(), z.null()])
      .optional(),
    status: z
      .enum(["broken", "active", "maintenance", "paused", "error", "degraded"])
      .optional(),
    slack_webhook_url: z
      .string()
      .url("Invalid webhook URL")
      .nullable()
      .optional(),
    error_message: z.string().nullable().optional(),
    last_check_at: z.string().datetime().nullable().optional(),
    last_success_at: z.string().datetime().nullable().optional(),
    last_failure_at: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) => {
      // If check_type is http, url should be provided
      if (data.check_type === "http" && data.url === null) {
        return false;
      }
      return true;
    },
    {
      message: "URL is required for HTTP monitors",
      path: ["url"],
    }
  )
  .refine(
    (data) => {
      // If check_type is tcp, tcp_host_port should be provided
      if (data.check_type === "tcp" && !data.tcp_host_port) {
        return false;
      }
      return true;
    },
    {
      message: "Host and port are required for TCP monitors",
      path: ["tcp_host_port"],
    }
  )
  .refine(
    (data) => {
      // Method should only be set for HTTP monitors
      if (data.check_type === "tcp" && data.method !== null) {
        return false;
      }
      return true;
    },
    {
      message: "Method is not applicable for TCP monitors",
      path: ["method"],
    }
  )
  .refine(
    (data) => {
      // Headers and body should only be set for HTTP monitors
      if (
        data.check_type === "tcp" &&
        (data.headers !== null || data.body !== null)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Headers and body are not applicable for TCP monitors",
      path: ["headers", "body"],
    }
  );

export const MemberInviteSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  role: z.enum(["admin", "member", "viewer"], {
    errorMap: () => ({ message: "Please select a valid role" }),
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
  creatorEmail: z.string(),
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
  monitors: z.array(z.string()).min(1, {
    message: "Please select at least one monitor",
  }),
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});

export const IncidentUpdateSchema = z.object({
  acknowledged_at: z.string().datetime().optional(),
  resolved_at: z.string().datetime().optional(),
  post_mortem: z
    .string()
    .max(2000, "Post-mortem cannot exceed 2000 characters")
    .optional(),
});

export const HeartbeatSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Heartbeat name cannot be empty")
    .max(100, "Heartbeat name is too long"),
  expected_lapse_ms: z
    .number()
    .int()
    .min(1000, "Expected lapse must be at least 1 second (1000ms)")
    .max(3600000, "Expected lapse must be less than 1 hour (3600000ms)"),
  grace_period_ms: z
    .number()
    .int()
    .min(0, "Grace period cannot be negative")
    .max(300000, "Grace period must be less than 5 minutes (300000ms)"),
  workspace_id: z.string().uuid("Invalid workspace ID format"),
});
