import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables, Log } from "../../../lib/types";
import { openApiErrorResponses } from "../../../lib/utils";
import { LogSchema } from "../logs/schemas";
import { MonitorSchema, RegionEnum, UUIDParamSchema } from "./schemas";

const route = createRoute({
  method: "get",
  path: "/monitors/:id",
  request: {
    params: UUIDParamSchema,

    query: z.object({
      days: z
        .preprocess(
          (v) => (v == null || v === "" ? undefined : Number(v)),
          z.number().int().min(1).max(28)
        )
        .optional()
        .openapi({ example: 7 }),
      region: RegionEnum.optional(),
    }),
  },

  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            data: MonitorSchema.extend({
              recent_logs: z.array(LogSchema.partial()).optional(),
              incidents: z
                .array(
                  z.object({
                    id: z.string(),
                    monitor_id: z.string(),
                    created_at: z.string(),
                  })
                )
                .optional(),
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

export default function registerGetMonitor(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: monitorId } = c.req.valid("param");
    const { days: daysQuery, region } = c.req.valid("query");

    const days = daysQuery ?? 7;

    try {
      const { data: monitor, error: monitorError } = await supabase
        .from("monitors")
        .select("*")
        .eq("id", monitorId)
        .single();

      if (monitorError) {
        if (monitorError.code === "PGRST116") {
          throw new HTTPException(404, { message: "Monitor not found" });
        }
        throw new HTTPException(500, {
          message: "Database error fetching monitor",
        });
      }

      if (!monitor) {
        throw new HTTPException(404, { message: "Monitor not found" });
      }

      const date = new Date();
      // fetch double the days to enable comparison with previous period
      if (days === 1) {
        date.setDate(date.getDate() - 2);
      } else if (days === 7) {
        date.setDate(date.getDate() - 14);
      } else if (days === 14) {
        date.setDate(date.getDate() - 28);
      } else {
        date.setDate(date.getDate() - days);
      }

      const daysAgo = date.toISOString();

      let logsQuery = supabase
        .from("logs")
        .select("id, created_at, ok, latency, region, status_code")
        .eq("monitor_id", monitorId)
        .gte("created_at", daysAgo)
        .order("created_at", { ascending: false });

      if (region) logsQuery = logsQuery.eq("region", region);

      const [membershipResult, logsResult, incidentsResult] = await Promise.all(
        [
          supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", monitor.workspace_id)
            .eq("user_id", userId)
            .eq("invitation_status", "accepted")
            .single(),
          logsQuery,
          supabase
            .from("incidents")
            .select("*")
            .eq("monitor_id", monitorId)
            .or(`created_at.gte.${daysAgo},resolved_at.is.null`)
            .order("created_at", { ascending: false }),
        ]
      );

      const { data: membership, error: membershipError } = membershipResult;
      const { data: recentLogs, error: logError } = logsResult;
      const { data: incidents, error: incidentError } = incidentsResult;

      if (membershipError || !membership) {
        throw new HTTPException(404, { message: "Monitor not found" });
      }

      if (logError) {
        console.error(
          `Error fetching recent logs for monitor ${monitorId}:`,
          logError
        );
        monitor.recent_logs = [] as Log[];
      } else {
        monitor.recent_logs = (recentLogs || []) as Log[];
      }

      if (incidentError) {
        console.error(
          `Error fetching incidents for monitor ${monitorId}:`,
          incidentError
        );
        monitor.incidents = [];
      } else {
        monitor.incidents = incidents || [];
      }

      return c.json({
        data: monitor,
        success: true,
        error: null,
      });
    } catch {
      throw new HTTPException(500, { message: "Failed to get monitor" });
    }
  });
}
