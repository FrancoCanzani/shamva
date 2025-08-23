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

export const CollectorsCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Collector name cannot be empty")
    .max(100, "Collector name is too long"),
  workspaceId: z.uuid("Invalid workspace ID format"),
  token: z
    .string()
    .trim()
    .min(1, "Agent token is required")
    .max(255, "Agent token is too long"),
});

export const CollectorsParamsSchema = CollectorsCreateSchema.omit({ token: true, workspaceId: true });

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
      .refine((val) => !val || z.url().safeParse(val).success, {
        error: "Invalid URL format",
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
    headers: z.record(z.string(), z.string()).optional(),
    body: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
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
    workspaceId: z.uuid("Invalid workspace ID format"),
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
      error:
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
      error: "Method is required for HTTP checks",
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
    url: z.url("Invalid URL format").nullable().optional(),
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
    error_message: z.string().nullable().optional(),
    last_check_at: z.iso.datetime().nullable().optional(),
    last_success_at: z.iso.datetime().nullable().optional(),
    last_failure_at: z.iso.datetime().nullable().optional(),
    degraded_threshold_ms: z
      .number()
      .int()
      .min(1000, "Degraded threshold must be at least 1 second")
      .max(300000, "Degraded threshold cannot exceed 5 minutes")
      .optional(),
    timeout_threshold_ms: z
      .number()
      .int()
      .min(1000, "Timeout threshold must be at least 1 second")
      .max(600000, "Timeout threshold cannot exceed 10 minutes")
      .optional(),
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
      error: "URL is required for HTTP monitors",
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
      error: "Host and port are required for TCP monitors",
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
      error: "Method is not applicable for TCP monitors",
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
      error: "Headers and body are not applicable for TCP monitors",
      path: ["headers", "body"],
    }
  )
  .refine(
    (data) => {
      if (
        data.timeout_threshold_ms &&
        data.degraded_threshold_ms &&
        data.timeout_threshold_ms <= data.degraded_threshold_ms
      ) {
        return false;
      }
      return true;
    },
    {
      error: "Timeout threshold must be greater than degraded threshold",
      path: ["timeout_threshold_ms"],
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
  monitors: z.array(z.string()).min(1, "Please select at least one monitor"),
  workspaceId: z.uuid("Invalid workspace ID format"),
});

export const IncidentUpdateSchema = z.object({
  acknowledged_at: z.iso.datetime().optional(),
  resolved_at: z.iso.datetime().optional(),
  post_mortem: z
    .string()
    .max(100000, "Post-mortem cannot exceed 100000 characters")
    .optional(),
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

export const NotificationUpdateSchema = z
  .object({
    email_enabled: z.boolean().optional(),

    slack_enabled: z.boolean().optional(),
    slack_webhook_url: z.url("Invalid Slack webhook URL").nullable().optional(),
    slack_channel: z.string().nullable().optional(),

    discord_enabled: z.boolean().optional(),
    discord_webhook_url: z
      .url("Invalid Discord webhook URL")
      .nullable()
      .optional(),
    discord_channel: z.string().nullable().optional(),

    pagerduty_enabled: z.boolean().optional(),
    pagerduty_service_id: z.string().nullable().optional(),
    pagerduty_api_key: z.string().nullable().optional(),
    pagerduty_from_email: z
      .email("Invalid email address")
      .nullable()
      .optional(),

    sms_enabled: z.boolean().optional(),
    sms_phone_numbers: z
      .array(z.string().regex(/^\+\d{1,15}$/, "Invalid phone number format"))
      .nullable()
      .optional(),
    twilio_account_sid: z.string().nullable().optional(),
    twilio_auth_token: z.string().nullable().optional(),
    twilio_from_number: z
      .string()
      .regex(/^\+\d{1,15}$/, "Invalid phone number format")
      .nullable()
      .optional(),

    github_enabled: z.boolean().optional(),
    github_owner: z.string().nullable().optional(),
    github_repo: z.string().nullable().optional(),
    github_token: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.slack_enabled && !data.slack_webhook_url) {
        return false;
      }
      return true;
    },
    {
      message:
        "Slack webhook URL is required when Slack notifications are enabled",
      path: ["slack_webhook_url"],
    }
  )
  .refine(
    (data) => {
      if (data.discord_enabled && !data.discord_webhook_url) {
        return false;
      }
      return true;
    },
    {
      message:
        "Discord webhook URL is required when Discord notifications are enabled",
      path: ["discord_webhook_url"],
    }
  )
  .refine(
    (data) => {
      if (
        data.pagerduty_enabled &&
        (!data.pagerduty_service_id ||
          !data.pagerduty_api_key ||
          !data.pagerduty_from_email)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "PagerDuty service ID, API key, and from email are required when PagerDuty notifications are enabled",
      path: ["pagerduty_service_id"],
    }
  )
  .refine(
    (data) => {
      if (
        data.github_enabled &&
        (!data.github_owner || !data.github_repo || !data.github_token)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "GitHub owner, repo, and token are required when GitHub notifications are enabled",
      path: ["github_owner"],
    }
  );

export const MetricsSchema = z.object({
  timestamp: z.date("Invalid timestamp format"),
  hostname: z
    .string()
    .min(1, "Hostname is required")
    .max(255, "Hostname too long"),
  platform: z
    .string()
    .min(1, "Platform is required")
    .max(50, "Platform name too long"),
  cpu_percent: z
    .number()
    .min(0, "CPU percentage cannot be negative")
    .max(100, "CPU percentage cannot exceed 100"),
  load_avg_1: z.number().min(0, "Load average cannot be negative"),
  memory_percent: z
    .number()
    .min(0, "Memory percentage cannot be negative")
    .max(100, "Memory percentage cannot exceed 100"),
  memory_used_gb: z.number().min(0, "Memory used cannot be negative"),
  memory_total_gb: z.number().min(0, "Total memory cannot be negative"),
  disk_percent: z
    .number()
    .min(0, "Disk percentage cannot be negative")
    .max(100, "Disk percentage cannot exceed 100"),
  disk_free_gb: z.number().min(0, "Free disk space cannot be negative"),
  disk_total_gb: z.number().min(0, "Total disk space cannot be negative"),
  network_sent_mb: z.number().min(0, "Network sent cannot be negative"),
  network_recv_mb: z.number().min(0, "Network received cannot be negative"),
  network_sent_mbps: z.number().min(0, "Network send rate cannot be negative"),
  network_recv_mbps: z
    .number()
    .min(0, "Network receive rate cannot be negative"),
  top_process_name: z.string().max(255, "Process name too long"),
  top_process_cpu: z
    .number()
    .min(0, "Process CPU cannot be negative")
    .max(100, "Process CPU cannot exceed 100"),
  total_processes: z.number().int().min(0, "Process count cannot be negative"),
  temperature_celsius: z
    .number()
    .min(-273.15, "Temperature cannot be below absolute zero")
    .max(200, "Temperature seems unrealistic"),
  power_status: z.string().max(50, "Power status too long"),
  battery_percent: z
    .number()
    .min(0, "Battery percentage cannot be negative")
    .max(100, "Battery percentage cannot exceed 100"),
  network_connected: z.boolean(),
  network_interface: z.string().max(50, "Network interface name too long"),
  uptime_seconds: z.number().int().min(0, "Uptime cannot be negative"),
});
