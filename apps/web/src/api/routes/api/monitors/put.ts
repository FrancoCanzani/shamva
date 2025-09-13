import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { MonitorSchema, MonitorBodySchema } from "./schemas";

const route = createRoute({
  method: "put",
  path: "/monitors/:id",
  request: {
    params: z.object({
      id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
    }),
    body: { content: { "application/json": { schema: MonitorBodySchema } } },
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

export default function registerPutMonitor(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: monitorId } = c.req.valid("param");
    const result = c.req.valid("json");

    const {
      name,
      checkType,
      url,
      tcpHostPort,
      method,
      headers,
      body,
      headersString,
      bodyString,
      regions,
      interval,
      degradedThresholdMs,
      timeoutThresholdMs,
    } = result;

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
      const finalInterval = interval ?? existingMonitor.interval;

      // Parse headers and body from strings if provided
      let parsedHeaders: Record<string, string> | undefined = headers;
      if (headersString && !headers) {
        try {
          parsedHeaders = JSON.parse(headersString);
        } catch {
          throw new HTTPException(400, {
            message: "Invalid headers JSON format.",
          });
        }
      }

      let parsedBody: Record<string, unknown> | string | undefined = body;
      if (bodyString && !body) {
        try {
          parsedBody = JSON.parse(bodyString);
        } catch {
          throw new HTTPException(400, {
            message: "Invalid body JSON format.",
          });
        }
      }

      const updateData = {
        name,
        check_type: checkType,
        url: checkType === "http" ? url : null,
        tcp_host_port: checkType === "tcp" ? tcpHostPort : null,
        method: checkType === "http" ? method : null,
        headers: parsedHeaders ?? {},
        body: parsedBody,
        interval: finalInterval,
        regions,
        degraded_threshold_ms: degradedThresholdMs ?? null,
        timeout_threshold_ms: timeoutThresholdMs ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedMonitor, error: updateError } = await supabase
        .from("monitors")
        .update(updateData)
        .eq("id", monitorId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating monitor:", updateError);
        throw new HTTPException(500, { message: "Failed to update monitor" });
      }

      return c.json({ data: updatedMonitor, success: true, error: null });
    } catch {
      throw new HTTPException(500, { message: "Failed to update monitor" });
    }
  });
}
