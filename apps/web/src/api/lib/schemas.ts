import z from "zod";

const tcpHostPortSchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*:[1-9]\d{0,4}$/,
    "Please enter a valid host:port format (e.g., example.com:8080)"
  )
  .refine(
    (value) => {
      const port = parseInt(value.split(":")[1], 10);
      return port >= 1 && port <= 65535;
    },
    "Port must be between 1 and 65535"
  );

export const MonitorsParamsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Monitor name cannot be empty")
      .max(100, "Monitor name is too long"),
    checkType: z.enum(["http", "tcp"], {
      errorMap: () => ({ message: "Please select a valid check type" }),
    }),
    url: z.string().trim().url("Invalid URL format").optional(),
    tcpHostPort: tcpHostPortSchema.optional(),
    method: z.enum(["GET", "POST", "HEAD"]).optional(),
    regions: z.array(z.string()).min(1),
    interval: z.number().int().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    body: z
      .union([
        z.string(), // Allows plain text or pre-stringified JSON
        z.record(z.string(), z.unknown()),
      ])
      .nullable()
      .optional(),
    workspaceId: z.string().uuid("Invalid workspace ID format"),
    slackWebhookUrl: z
      .string()
      .url({ message: "Invalid Slack webhook URL format" })
      .optional(),
  })
  .refine(
    (data) => {
      // URL is required for HTTP checks
      if (data.checkType === "http" && (!data.url || data.url.trim() === "")) {
        return false;
      }
      // TCP host:port is required for TCP checks
      if (data.checkType === "tcp" && (!data.tcpHostPort || data.tcpHostPort.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "URL is required for HTTP checks, Host:Port is required for TCP checks",
      path: ["url"],
    }
  )
  .refine(
    (data) => {
      // Method is required for HTTP checks
      if (data.checkType === "http" && !data.method) {
        return false;
      }
      return true;
    },
    {
      message: "Method is required for HTTP checks",
      path: ["method"],
    }
  )
  .refine(
    (data) => {
      // Headers and body are only applicable for HTTP checks
      if (data.checkType === "tcp") {
        return !data.headers && !data.body;
      }
      return true;
    },
    {
      message: "Headers and body are only applicable for HTTP checks",
      path: ["headers"],
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
