import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { FeedbackBodySchema, FeedbackSchema } from "./schemas";

const route = createRoute({
  method: "post",
  path: "/feedback",
  request: {
    body: { content: { "application/json": { schema: FeedbackBodySchema } } },
  },
  responses: {
    200: {
      description: "Created",
      content: {
        "application/json": {
          schema: z.object({
            data: FeedbackSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPostFeedback(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { message } = c.req.valid("json");

    const { data, error: insertError } = await supabase
      .from("feedbacks")
      .insert([
        {
          user_id: userId,
          message,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError || !data) {
      throw new HTTPException(500, { message: "Failed to save feedback" });
    }

    return c.json({ data, success: true, error: null });
  });
}
