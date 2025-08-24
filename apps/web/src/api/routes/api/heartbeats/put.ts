import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import {
  HeartbeatBodySchema,
  HeartbeatSchema,
  UUIDParamSchema,
} from "./schemas";

const route = createRoute({
  method: "put",
  path: "/heartbeats/:id",
  request: {
    params: UUIDParamSchema,
    body: { content: { "application/json": { schema: HeartbeatBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated",
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

export default function registerPutHeartbeat(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const { id: heartbeatId } = c.req.valid("param");
    const { name, expectedLapseMs, gracePeriodMs, workspaceId, pingId } =
      c.req.valid("json");
    const userId = c.get("userId");

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

    const { data: existingHeartbeat, error: fetchError } = await supabase
      .from("heartbeats")
      .select("id, workspace_id")
      .eq("id", heartbeatId)
      .single();

    if (fetchError || !existingHeartbeat) {
      throw new HTTPException(404, { message: "Heartbeat not found" });
    }

    if (existingHeartbeat.workspace_id !== workspaceId) {
      throw new HTTPException(403, { message: "Heartbeat workspace mismatch" });
    }

    const { data: heartbeat, error } = await supabase
      .from("heartbeats")
      .update({
        name,
        ping_id: pingId,
        expected_lapse_ms: expectedLapseMs,
        grace_period_ms: gracePeriodMs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", heartbeatId)
      .select()
      .single();

    if (error || !heartbeat) {
      throw new HTTPException(500, { message: "Failed to update heartbeat" });
    }

    return c.json({ data: heartbeat, success: true, error: null });
  });
}
