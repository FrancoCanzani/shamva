import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { supabase } from "../../../lib/supabase/client";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { IncidentUpdateSchema } from "./schemas";

const route = createRoute({
  method: "post",
  path: "/incidents/:id/updates",
  request: {
    params: z.object({
      id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            content: z.string().min(1).max(2000),
            authorName: z.string().min(1).max(200),
            authorEmail: z.email().max(200),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Created",
      content: {
        "application/json": {
          schema: z.object({
            data: IncidentUpdateSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPostIncidentUpdate(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: incidentId } = c.req.valid("param");

    const { content, authorName, authorEmail } = c.req.valid("json");

    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("monitor_id")
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
      throw new HTTPException(404, {
        message: "Monitor not found for incident",
      });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role, user_id")
      .eq("workspace_id", monitor.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("incident_updates")
      .insert({
        incident_id: incidentId,
        author_id: userId,
        author_name: authorName,
        author_email: authorEmail,
        content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw new HTTPException(500, { message: "Failed to add update" });
    }

    return c.json({ data: inserted, success: true, error: null });
  });
}
