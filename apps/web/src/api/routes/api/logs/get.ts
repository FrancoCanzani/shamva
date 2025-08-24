import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";
import { LogSchema } from "./schemas";
import { openApiErrorResponses } from "../../../lib/utils";
import { HTTPException } from "hono/http-exception";

const QuerySchema = z.object({
  workspaceId: z
    .uuid()
    .openapi({ example: "a81bc81b-dead-4e5d-abff-90865d1e13b1" }),
  limit: z
    .preprocess(
      (v) => (v == null || v === "" ? undefined : Number(v)),
      z.number().int().min(20).max(500)
    )
    .optional()
    .openapi({ example: 100 }),
  cursorCreatedAt: z
    .string()
    .optional()
    .openapi({ example: "2025-08-24T00:00:00.000Z" }),
  cursorId: z
    .string()
    .optional()
    .openapi({ example: "a81bc81b-dead-4e5d-abff-90865d1e13b1" }),
});

const LogsSchema = z.object({
  data: z.array(LogSchema),
  success: z.literal(true),
  error: z.null(),
  nextCursor: z
    .object({
      createdAt: z.string(),
      id: z.string(),
    })
    .nullable(),
});

const route = createRoute({
  method: "get",
  path: "/logs",
  request: { query: QuerySchema },
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: LogsSchema } },
    },
    ...openApiErrorResponses,
  },
});

export default function registerGetLogs(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const {
      workspaceId,
      cursorCreatedAt,
      cursorId,
      limit: rawLimit,
    } = c.req.valid("query");
    const userId = c.get("userId");

    const limit = rawLimit ?? 100;

    try {
      const { data: membership, error: membershipError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .single();

      if (membershipError || !membership) {
        if (membershipError?.code === "PGRST116") {
          throw new HTTPException(404, {
            message: "Workspace not found or user not a member",
          });
        }
        throw new HTTPException(403, {
          message: "Unauthorized to access logs in this workspace",
        });
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      let query = supabase
        .from("logs")
        .select("*")
        .eq("workspace_id", workspaceId)
        .gte("created_at", sevenDaysAgoISO)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cursorCreatedAt && cursorId) {
        query = query.or(
          `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
        );
      } else if (cursorCreatedAt) {
        query = query.lt("created_at", cursorCreatedAt);
      }

      const { data: logs, error: logError } = await query;

      if (logError) {
        console.error(
          `Error fetching logs for workspace ${workspaceId}:`,
          logError
        );
        throw new HTTPException(500, {
          message: "Database error fetching logs",
        });
      }

      const validatedLogs = (logs || []).map((log) => LogSchema.parse(log));

      const nextCursor =
        logs && logs.length === limit
          ? {
              createdAt: (logs[logs.length - 1].created_at as string) ?? "",
              id: (logs[logs.length - 1].id as string) ?? "",
            }
          : null;

      return c.json({
        data: validatedLogs,
        success: true,
        error: null,
        nextCursor,
      });
    } catch (error) {
      console.error("Error in logs endpoint:", error);
      throw new HTTPException(500, {
        message: "An unexpected error occurred while fetching logs",
      });
    }
  });
}
