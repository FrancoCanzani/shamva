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
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
};


export const MonitorsParamsSchema = z
  .object({
    name: z.string().trim().min(1, "Monitor name cannot be empty").max(100, "Monitor name is too long"),
    checkType: z.enum(["http", "tcp"]),
    url: z.string().optional().transform(val => val === '' ? undefined : val).refine(val => !val || z.string().url().safeParse(val).success, {
      message: "Invalid URL format",
    }),    
    tcpHostPort: z.string()
      .trim()
      .regex(
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*:[1-9]\d{0,4}$/,
        "Please enter a valid host:port format (e.g., example.com:8080)"
      )
      .optional()
      .transform(val => val === '' ? undefined : val),
    method: z.enum(["GET", "POST", "HEAD"]).optional(),
    interval: z.number().int().min(60000, "Interval must be at least 1 minute").max(3600000, "Interval must be less than 1 hour"),
    regions: z.array(z.string()).min(1, "Please select at least one monitoring region"),
    headersString: z
      .string()
      .trim()
      .optional()
      .refine(isValidJSONObject, 'Headers must be a valid JSON object string, e.g. {"key": "value"}'),
    bodyString: z
      .string()
      .trim()
      .optional()
      .refine(isValidJSON, 'Body must be a valid JSON string, e.g. {"key": "value"} or "text"'),
    slackWebhookUrl: z
      .string()
      .trim()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.checkType === "http" && (!data.url || data.url.trim() === "")) {
        return false;
      }
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
