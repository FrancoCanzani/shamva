import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import { supabase } from "../../../lib/supabase/client";
import type { ApiVariables } from "../../../lib/types";

const LogsQuery = z.object({
  workspaceId: z
    .uuid()
    .openapi({ example: "c0a80101-0000-4000-8000-000000000000" }),
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
  cursorId: z.string().optional().openapi({ example: "abcd1234" }),
});

const Logs200 = z.object({
  data: z.array(z.any()),
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
  path: "/api/logs",
  request: { query: LogsQuery },
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: Logs200 } },
    },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
    500: { description: "Server error" },
  },
});

export const registerGetLogs = (
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) => {
  api.openapi(route, async (c) => {
    const {
      workspaceId,
      cursorCreatedAt,
      cursorId,
      limit: rawLimit,
    } = c.req.valid("query");
    const userId = c.get("userId");

    const limit = rawLimit ?? 100;

    if (!userId) {
      return c.json(
        { data: null, success: false, error: "User not authenticated" },
        401
      );
    }

    try {
      const { data: membership, error: membershipError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .single();

      if (membershipError || !membership) {
        if (membershipError?.code === "PGRST116") {
          return c.json(
            {
              data: null,
              success: false,
              error: "Workspace not found or user not a member",
            },
            404
          );
        }
        return c.json(
          {
            data: null,
            success: false,
            error: "Unauthorized to access logs in this workspace",
          },
          403
        );
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
        return c.json(
          {
            data: null,
            success: false,
            error: "Database error fetching logs",
            details: logError.message,
          },
          500
        );
      }

      const nextCursor =
        logs && logs.length === limit
          ? {
              createdAt: (logs[logs.length - 1].created_at as string) ?? "",
              id: (logs[logs.length - 1].id as string) ?? "",
            }
          : null;

      return c.json({
        data: logs || [],
        success: true,
        error: null,
        nextCursor,
      });
    } catch (unexpectedError) {
      console.error(
        `Unexpected error getting logs for workspace ${workspaceId}:`,
        unexpectedError
      );
      const errorDetails =
        unexpectedError instanceof Error
          ? unexpectedError.message
          : String(unexpectedError);
      return c.json(
        {
          data: null,
          success: false,
          error: "An unexpected error occurred while fetching logs",
          details: errorDetails,
        },
        500
      );
    }
  });
};
