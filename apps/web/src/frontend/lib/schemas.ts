import z from "zod";

const validIntervals = [60000, 300000, 600000, 900000, 1800000, 3600000];

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

export const MonitorFormSchema = z
  .object({
    name: z.string().trim().min(1, "Monitor name cannot be empty").max(100, "Monitor name is too long"),
    checkType: z.enum(["http", "tcp"], { errorMap: () => ({ message: "Please select a valid check type" }) }),
    url: z.string().trim().url("Please enter a valid URL").optional(),
    tcpHostPort: tcpHostPortSchema.optional(),
    method: z.enum(["GET", "POST", "HEAD"], { errorMap: () => ({ message: "Please select a valid method" }) }).optional(),
    interval: z.number().refine(
      (val) => validIntervals.includes(val),
      "Please select a valid check interval"
    ),
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
    slackWebhookUrl: z.string().trim().url("Please enter a valid Slack webhook URL").optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional field requirements based on checkType
    if (data.checkType === "http" && !data.url?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL is required for HTTP checks",
        path: ["url"],
      });
    }
    
    if (data.checkType === "tcp" && !data.tcpHostPort?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Host:Port is required for TCP checks",
        path: ["tcpHostPort"],
      });
    }

    // Method is required for HTTP checks
    if (data.checkType === "http" && !data.method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Method is required for HTTP checks",
        path: ["method"],
      });
    }

    // Body only allowed for POST method
    if (data.method !== "POST" && data.bodyString?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Request body is only applicable for POST method",
        path: ["bodyString"],
      });
    }

    // Headers and body only for HTTP checks
    if (data.checkType === "tcp") {
      if (data.headersString?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Headers are only applicable for HTTP checks",
          path: ["headersString"],
        });
      }
      if (data.bodyString?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Body is only applicable for HTTP checks",
          path: ["bodyString"],
        });
      }
    }
  });

export const MemberInviteSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  role: z.enum(["admin", "member", "viewer"], { errorMap: () => ({ message: "Please select a valid role" }) }),
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
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
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
  title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  showValues: z.boolean().default(true),
  password: z.string().max(100, "Password cannot exceed 100 characters").optional(),
  isPublic: z.boolean().default(true),
  monitors: z.array(z.string()).min(1, "Please select at least one monitor"),
});