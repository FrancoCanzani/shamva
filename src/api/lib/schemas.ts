import z from "zod";

export const MonitorsParamsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Monitor name cannot be empty")
    .max(100, "Monitor name is too long"),
  url: z.string().url({ message: "Invalid URL format" }),
  method: z.enum(["GET", "POST", "HEAD"]).default("GET"),
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
  slackWebhookUrl: z.string().url({ message: "Invalid Slack webhook URL format" }).optional(),
});

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
  creatorEmail: z.string(),
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
  workspaceId: z.string().uuid("Invalid workspace ID format"),
});
