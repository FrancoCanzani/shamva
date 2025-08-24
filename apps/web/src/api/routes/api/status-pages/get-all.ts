import { Context } from "hono";
import { supabase } from "../../../lib/supabase/client";

export default async function getAllStatusPages(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.query("workspaceId");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401
    );
  }

  try {
    let query = supabase.from("status_pages").select(`
        *,
        workspace:workspaces(id, name)
      `);

    if (workspaceId) {
      // Check if user has access to this workspace
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .single();

      if (!membership) {
        return c.json({ data: [], success: true, error: null }, 200);
      }

      query = query.eq("workspace_id", workspaceId);
    } else {
      // Get all workspaces the user has access to
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId);

      if (!memberships || memberships.length === 0) {
        return c.json({
          data: [],
          success: true,
          error: null,
        });
      }

      const workspaceIds = memberships.map((m) => m.workspace_id);
      query = query.in("workspace_id", workspaceIds);
    }

    const { data: statusPages, error: statusPagesError } = await query.order(
      "created_at",
      { ascending: false }
    );

    if (statusPagesError) {
      console.error("Error fetching status pages from DB:", statusPagesError);
      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching status pages",
          details: statusPagesError.message,
        },
        500
      );
    }

    return c.json({
      data: statusPages || [],
      success: true,
      error: null,
    });
  } catch (err) {
    console.error("Unexpected error fetching status pages:", err);
    const errorDetails = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        data: null,
        success: false,
        error: "An unexpected error occurred",
        details: errorDetails,
      },
      500
    );
  }
}
