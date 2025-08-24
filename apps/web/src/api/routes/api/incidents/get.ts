import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { supabase } from "../../../lib/supabase/client";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { IncidentSchema, IncidentUpdateSchema } from "./schemas";
import { UUIDParamSchema } from "../monitors/schemas";

const route = createRoute({
  method: "get",
  path: "/incidents/:id",
  request: {
    params: UUIDParamSchema,
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: IncidentSchema.extend({
              updates: z.array(IncidentUpdateSchema),
            }),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetIncident(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: incidentId } = c.req.valid("param");

    try {
      const [incidentResult, updatesResult] = await Promise.all([
        supabase
          .from("incidents")
          .select(
            `
          *,
          monitors (
            id,
            name,
            url,
            error_message,
            workspace_id
          )
        `
          )
          .eq("id", incidentId)
          .single(),
        supabase
          .from("incident_updates")
          .select("*")
          .eq("incident_id", incidentId)
          .order("created_at", { ascending: true }),
      ]);

      const { data: incident, error: fetchError } = incidentResult;
      const { data: updates, error: updatesError } = updatesResult;

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          throw new HTTPException(404, { message: "Incident not found" });
        }
        throw new HTTPException(500, { message: "Failed to fetch incident" });
      }

      if (!incident)
        throw new HTTPException(404, { message: "Incident not found" });

      const { data: membership, error: membershipError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", incident.monitors.workspace_id)
        .eq("user_id", userId)
        .eq("invitation_status", "accepted")
        .single();

      if (membershipError || !membership) {
        throw new HTTPException(404, { message: "Incident not found" });
      }

      if (updatesError) {
        throw new HTTPException(500, { message: "Failed to fetch updates" });
      }

      return c.json({
        data: { ...incident, updates },
        success: true,
        error: null,
      });
    } catch {
      throw new HTTPException(500, { message: "Failed to fetch incident" });
    }
  });
}
