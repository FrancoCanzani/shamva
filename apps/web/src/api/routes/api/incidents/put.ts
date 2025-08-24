import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { IncidentUpdateSchema } from "./schemas";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";

const route = createRoute({
  method: "put",
  path: "/incidents/:id",
  request: {
    params: z.object({
      id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
    }),
    body: { content: { "application/json": { schema: IncidentUpdateSchema } } },
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.any(),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPutIncident(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: incidentId } = c.req.valid("param");

    const { acknowledged_at, post_mortem, resolved_at } = c.req.valid("json");

    const { data: existingIncident, error: fetchError } = await supabase
      .from("incidents")
      .select(
        `
      *,
      monitors (
        id,
        name,
        url,
        workspace_id
      )
    `
      )
      .eq("id", incidentId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new HTTPException(404, { message: "Incident not found" });
      }
      throw new HTTPException(500, {
        message: "Database error fetching incident",
      });
    }

    if (!existingIncident)
      throw new HTTPException(404, { message: "Incident not found" });

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", existingIncident.monitors.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(404, { message: "Incident not found" });
    }

    if (membership.role === "viewer") {
      return c.json({ success: false, error: "Insufficient permissions" }, 403);
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (acknowledged_at !== undefined) {
        updateData.acknowledged_at = acknowledged_at;
      }
      if (resolved_at !== undefined) {
        updateData.resolved_at = resolved_at;
      }
      if (post_mortem !== undefined) {
        updateData.post_mortem = post_mortem;
      }

      const { data: updatedIncident, error: updateError } = await supabase
        .from("incidents")
        .update(updateData)
        .eq("id", incidentId)
        .select(
          `
        *,
        monitors (
          id,
          name,
          url,
          workspace_id
        )
      `
        )
        .single();

      if (updateError) {
        throw new HTTPException(500, { message: "Failed to update incident" });
      }

      return c.json({ data: updatedIncident, success: true, error: null });
    } catch {
      throw new HTTPException(500, { message: "Failed to update incident" });
    }
  });
}
