import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import { CollectorWithLastMetricSchema, WorkspaceQuerySchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/collectors",
  request: { query: WorkspaceQuerySchema },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(CollectorWithLastMetricSchema),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetAllCollectors(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("query");

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      throw new HTTPException(403, {
        message: "Unauthorized to list collectors",
      });
    }

    const { data: collectors, error: collectorsError } = await supabase
      .from("collectors")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (collectorsError) {
      throw new HTTPException(500, { message: "Failed to fetch collectors" });
    }

    const daysLimit = new Date();
    daysLimit.setDate(daysLimit.getDate() - 14);

    const collectorsWithMetrics = await Promise.all(
      (collectors ?? []).map(async (collector) => {
        const { data: lastMetric } = await supabase
          .from("metrics")
          .select("*")
          .eq("collector_id", collector.id)
          .gt("created_at", daysLimit)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return { ...collector, last_metric: lastMetric || undefined };
      })
    );

    return c.json({ data: collectorsWithMetrics, success: true, error: null });
  });
}
