import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { supabase } from "../../../lib/supabase/client";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";

const route = createRoute({
  method: "delete",
  path: "/incidents/:id/updates/:updateId",
  request: {
    params: z.object({
      id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
      updateId: z.uuid().openapi({ param: { name: "updateId", in: "path" } }),
    }),
  },
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

export default function registerDeleteIncidentUpdate(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: incidentId, updateId } = c.req.valid("param");

    const { data: update, error: updateError } = await supabase
      .from("incident_updates")
      .select("id, author_id, incident_id")
      .eq("id", updateId)
      .eq("incident_id", incidentId)
      .single();

    if (updateError || !update) {
      throw new HTTPException(404, { message: "Update not found" });
    }

    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("id, monitor_id")
      .eq("id", incidentId)
      .single();

    if (incidentError || !incident) {
      throw new HTTPException(404, { message: "Incident not found" });
    }

    const { data: monitor, error: monitorError } = await supabase
      .from("monitors")
      .select("workspace_id")
      .eq("id", incident.monitor_id)
      .single();

    if (monitorError || !monitor) {
      throw new HTTPException(404, { message: "Monitor not found" });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", monitor.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(404, {
        message: "Workspace membership not found",
      });
    }

    const isAdmin = membership && membership.role === "admin";
    const isAuthor = update.author_id === userId;

    if (!isAdmin && !isAuthor) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    const { error: deleteError } = await supabase
      .from("incident_updates")
      .delete()
      .eq("id", updateId)
      .eq("incident_id", incidentId);

    if (deleteError) {
      throw new HTTPException(500, { message: "Failed to delete update" });
    }

    return c.json({ success: true });
  });
}
