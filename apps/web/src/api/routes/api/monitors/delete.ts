import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { UUIDParamSchema } from "./schemas";

const route = createRoute({
  method: "delete",
  path: "/monitors/:id",
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

export default function registerDeleteMonitor(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: monitorId } = c.req.valid("param");

    const { data: existingMonitor, error: fetchError } = await supabase
      .from("monitors")
      .select("*")
      .eq("id", monitorId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new HTTPException(404, { message: "Monitor not found" });
      }
      throw new HTTPException(500, {
        message: "Database error fetching monitor",
      });
    }

    if (!existingMonitor)
      throw new HTTPException(404, { message: "Monitor not found" });

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", existingMonitor.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(404, { message: "Monitor not found" });
    }

    if (membership.role === "viewer") {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    try {
      const { error: deleteError } = await supabase
        .from("monitors")
        .delete()
        .eq("id", monitorId);

      if (deleteError) {
        throw new HTTPException(500, { message: "Failed to delete monitor" });
      }

      return c.json({ success: true });
    } catch {
      throw new HTTPException(500, { message: "Failed to delete monitor" });
    }
  });
}
