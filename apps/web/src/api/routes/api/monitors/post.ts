import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { MonitorCreateBodySchema, MonitorSchema } from "./schemas";

const route = createRoute({
  method: "post",
  path: "/monitors",
  request: {
    body: {
      content: { "application/json": { schema: MonitorCreateBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Created",
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

export default function registerPostMonitor(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
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
      workspaceId,
    } = c.req.valid("json");
    const userId = c.get("userId");

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(403, {
        message:
          "You do not have permission to create monitors in this workspace.",
      });
    }

    if (membership.role === "viewer") {
      return c.json(
        {
          data: null,
          success: false,
          error:
            "Viewers cannot create monitors. Contact a workspace admin or member.",
        },
        403
      );
    }

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
        throw new HTTPException(400, { message: "Invalid body JSON format." });
      }
    }

    try {
      const { data, error: insertError } = await supabase
        .from("monitors")
        .insert([
          {
            name: name,
            check_type: checkType,
            url: url,
            tcp_host_port: tcpHostPort,
            method: method,
            headers: parsedHeaders ?? {},
            body: parsedBody,
            workspace_id: workspaceId,
            interval: interval ?? 5 * 60000,
            status: "initializing",
            regions: regions,
            degraded_threshold_ms: degradedThresholdMs || null,
            timeout_threshold_ms: timeoutThresholdMs || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw new HTTPException(500, {
          message: "Failed to create monitor record",
        });
      }

      if (!data)
        throw new HTTPException(500, {
          message: "Failed to create monitor record",
        });

      return c.json({ data: data, success: true, error: null });
    } catch {
      throw new HTTPException(500, {
        message: "Failed to create monitor in database.",
      });
    }
  });
}
