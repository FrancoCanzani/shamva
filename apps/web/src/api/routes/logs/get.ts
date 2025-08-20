import { Context } from "hono";
import z from "zod";
import { supabase } from "../../lib/supabase/client";

const LogsQuerySchema = z.object({
  workspaceId: z.uuid("Invalid workspace ID format"),
  limit: z
    .string()
    .transform((val) => {
      const parsed = Number(val);
      if (Number.isFinite(parsed)) return parsed;
      return 100;
    })
    .optional(),
  cursorCreatedAt: z.string().min(1).optional(),
  cursorId: z.string().optional(),
});

export default async function getLogs(c: Context): Promise<Response> {
  const userId = c.get("userId");
  const queryParams = c.req.query();

  const parsed = LogsQuerySchema.safeParse(queryParams);

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => issue.message)
      .join(", ");
    return c.json(
      {
        data: null,
        success: false,
        error: messages,
      },
      400
    );
  }

  const { workspaceId, cursorCreatedAt, cursorId } = parsed.data;
  let limit = parsed.data.limit ?? 100;

  if (limit < 20) limit = 20;
  if (limit > 500) limit = 500;

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

    // Keyset pagination: (created_at, id) < (cursorCreatedAt, cursorId)
    if (cursorCreatedAt && cursorId) {
      query = query.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      );
    } else if (cursorCreatedAt) {
      // Fallback if only timestamp provided
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
            createdAt: logs[logs.length - 1].created_at as string,
            id: logs[logs.length - 1].id as string,
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
}
