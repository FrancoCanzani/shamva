import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { MonitorSchema, UUIDParamSchema } from "./schemas";

const route = createRoute({
  method: "patch",
  path: "/monitors/:id",
  request: {
    params: UUIDParamSchema,
    body: { content: { "application/json": { schema: z.object({}) } } },
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: MonitorSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPatchMonitor(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: monitorId } = c.req.valid("param");
    const result = c.req.valid("json");

    const { data: existingMonitor, error: fetchError } = await supabase
      .from("monitors")
      .select("workspace_id")
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
      const updateData = {
        ...result,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedMonitor, error: updateError } = await supabase
        .from("monitors")
        .update(updateData)
        .eq("id", monitorId)
        .select()
        .single();

      if (updateError) {
        throw new HTTPException(500, { message: "Failed to update monitor" });
      }

      return c.json({ data: updatedMonitor, success: true, error: null });
    } catch {
      throw new HTTPException(500, { message: "Failed to update monitor" });
    }
  });
}
