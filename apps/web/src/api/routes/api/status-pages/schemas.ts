import { z } from "@hono/zod-openapi";

export const UUIDParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const StatusPageBodySchema = z.object({
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

export const StatusPageSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  show_values: z.boolean(),
  password: z.string().nullable(),
  is_public: z.boolean(),
  monitors: z.array(z.string()),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
