import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { UUIDParamSchema } from "./schemas";

const route = createRoute({
  method: "delete",
  path: "/heartbeats/:id",
  request: { params: UUIDParamSchema },
  responses: {
    200: {
      description: "Deleted",
      content: {
        "application/json": { schema: z.object({ success: z.literal(true) }) },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerDeleteHeartbeat(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const { id: heartbeatId } = c.req.valid("param");
    const userId = c.get("userId");

    const { data: heartbeat, error: fetchError } = await supabase
      .from("heartbeats")
      .select("id, workspace_id")
      .eq("id", heartbeatId)
      .single();

    if (fetchError || !heartbeat) {
      throw new HTTPException(404, { message: "Heartbeat not found" });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", heartbeat.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    const { error } = await supabase
      .from("heartbeats")
      .delete()
      .eq("id", heartbeatId);

    if (error) {
      throw new HTTPException(500, { message: "Failed to delete heartbeat" });
    }

    return c.json({ success: true });
  });
}
