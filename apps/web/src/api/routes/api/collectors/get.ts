import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { CollectorWithLastMetricSchema, UUIDParamSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/collectors/:id",
  request: { params: UUIDParamSchema },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: CollectorWithLastMetricSchema,
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetCollector(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: collectorId } = c.req.valid("param");

    const { data: collector, error: collectorError } = await supabase
      .from("collectors")
      .select("*")
      .eq("id", collectorId)
      .single();

    if (collectorError) {
      if (collectorError.code === "PGRST116") {
        throw new HTTPException(404, { message: "Collector not found" });
      }
      throw new HTTPException(500, {
        message: "Database error fetching collector",
      });
    }

    if (!collector) {
      throw new HTTPException(404, { message: "Collector not found" });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", collector.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(404, { message: "Collector not found" });
    }

    const { data: lastMetric } = await supabase
      .from("metrics")
      .select("*")
      .eq("collector_id", collectorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const collectorWithMetrics = {
      ...collector,
      last_metric: lastMetric || undefined,
    };
    return c.json({ data: collectorWithMetrics, success: true, error: null });
  });
}
