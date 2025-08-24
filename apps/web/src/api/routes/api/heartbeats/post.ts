import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { HeartbeatBodySchema, HeartbeatSchema } from "./schemas";

const route = createRoute({
  method: "post",
  path: "/heartbeats",
  request: {
    body: { content: { "application/json": { schema: HeartbeatBodySchema } } },
  },
  responses: {
    200: {
      description: "Created",
      content: {
        "application/json": {
          schema: z.object({
            data: HeartbeatSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPostHeartbeat(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { workspaceId, pingId, name, expectedLapseMs, gracePeriodMs } =
      c.req.valid("json");

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    if (membership.role === "viewer") {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    const { data, error: insertError } = await supabase
      .from("heartbeats")
      .insert([
        {
          workspace_id: workspaceId,
          ping_id: pingId,
          name,
          expected_lapse_ms: expectedLapseMs,
          grace_period_ms: gracePeriodMs,
          status: "idle",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError || !data) {
      throw new HTTPException(500, { message: "Failed to create heartbeat" });
    }

    return c.json({ data, success: true, error: null });
  });
}
