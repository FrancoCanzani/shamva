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
});

export const WorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  members: z.array(
    z.object({
      email: z
        .string()
        .email("Please enter a valid email address")
        .min(1, "Email is required"),
      role: z.enum(["admin", "member", "viewer"], {
        errorMap: () => ({ message: "Please select a valid role" }),
      }),
    }),
  ),
});
