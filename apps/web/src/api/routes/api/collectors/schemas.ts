import { z } from "@hono/zod-openapi";

export const UUIDParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const WorkspaceQuerySchema = z.object({
  workspaceId: z
    .uuid()
    .openapi({ example: "a81bc81b-dead-4e5d-abff-90865d1e13b1" }),
});

export const CollectorBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  workspaceId: z.uuid(),
  token: z.string().trim().min(1).max(255),
});

export const CollectorUpdateBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const CollectorSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  workspace_id: z.string(),
  is_active: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional(),
});

export const CollectorWithLastMetricSchema = CollectorSchema.extend({
  last_metric: z
    .object({
      id: z.string().optional(),
      created_at: z.string().optional(),
    })
    .optional(),
});
