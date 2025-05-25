import z from "zod";

const validIntervals = [60000, 300000, 600000, 900000, 1800000, 3600000];

export const MonitorFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Monitor name cannot be empty")
      .max(100, "Monitor name is too long"),
    url: z.string().trim().url("Please enter a valid URL"),
    method: z.enum(["GET", "POST", "HEAD"], {
      errorMap: () => ({ message: "Please select a valid method" }),
    }),
    interval: z
      .number()
      .refine(
        (val) =>
          validIntervals.includes(val as (typeof validIntervals)[number]),
        {
          message: "Please select a valid check interval",
        },
      ),
    regions: z.array(z.string()).min(1, {
      message: "Please select at least one monitoring region",
    }),
    headersString: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          try {
            const parsed = JSON.parse(val);
            return (
              typeof parsed === "object" &&
              parsed !== null &&
              !Array.isArray(parsed)
            );
          } catch {
            return false;
          }
        },
        {
          message:
            'Headers must be a valid JSON object string, e.g. {"key": "value"}',
        },
      ),
    bodyString: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        {
          message:
            'Body must be a valid JSON string, e.g. {"key": "value"} or "text"',
        },
      ),
  })
  .refine(
    (data) =>
      !(data.method !== "POST" && data.bodyString && data.bodyString !== ""),
    {
      message: "Request body is only applicable for POST method",
      path: ["bodyString"],
    },
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
      "Workspace name must be URL-friendly (lowercase letters, numbers, and hyphens, no leading/trailing/consecutive hyphens)",
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
      "Slug must be URL-friendly (lowercase letters, numbers, and hyphens, no leading/trailing/consecutive hyphens)",
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
});
