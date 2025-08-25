import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { EnvBindings } from "../../../../../../bindings";
import type { ApiVariables } from "../../../../lib/types";
import { openApiErrorResponses } from "../../../../lib/utils";
import { supabase } from "../../../../lib/supabase/client";

const QuerySchema = z.object({
  id: z.uuid().openapi({
    param: { name: "id", in: "query" },
    example: "a81bc81b-dead-4e5d-abff-90865d1e13b1",
  }),
});

const route = createRoute({
  method: "get",
  path: "/public/heartbeat",
  request: {
    query: QuerySchema,
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.object({
              timestamp: z.string(),
              message: z.string(),
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

export default function registerGetHeartbeat(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const { id: pingId } = c.req.valid("query");

    const now = new Date().toISOString();

    const { data: heartbeat, error: fetchError } = await supabase
      .from("heartbeats")
      .select("id, status, workspace_id")
      .eq("ping_id", pingId)
      .single();

    if (fetchError || !heartbeat) {
      throw new HTTPException(404, { message: "Heartbeat not found" });
    }

    const { error } = await supabase
      .from("heartbeats")
      .update({
        last_beat_at: now,
        updated_at: now,
        status: heartbeat.status === "idle" ? "active" : heartbeat.status,
      })
      .eq("ping_id", pingId);

    if (error) {
      throw new HTTPException(500, { message: "Failed to log heartbeat" });
    }

    try {
      const { error: logError } = await supabase
        .from("logs")
        .insert({
          workspace_id: heartbeat.workspace_id,
          monitor_id: null,
          heartbeat_id: heartbeat.id,
          url: c.req.url,
          status_code: 200,
          ok: true,
          latency: 0,
          headers: null,
          body_content: null,
          error: null,
          method: "GET",
          region: c.req.header("cf-ipcountry") || null,
          check_type: "heartbeat",
          tcp_host: null,
          tcp_port: null,
        })
        .select();

      if (logError) {
        console.error("Failed to log heartbeat event:", logError);
      }
    } catch (logInsertError) {
      console.error("Error logging heartbeat event:", logInsertError);
    }

    return c.json({
      data: { timestamp: now, message: "Heartbeat received" },
      success: true,
      error: null,
    });
  });
}
