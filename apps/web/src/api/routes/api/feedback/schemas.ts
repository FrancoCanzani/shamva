import { z } from "@hono/zod-openapi";

export const FeedbackBodySchema = z.object({
  message: z.string().min(1).max(1000),
});

export const FeedbackSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  message: z.string(),
  created_at: z.string(),
});
