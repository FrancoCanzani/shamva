import { Context } from "hono";
import { supabase } from "../../lib/supabase/client";

export default async function getStatusPages(c: Context) {
  const userId = c.get("userId");
  const statusPageId = c.req.param("id");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401
    );
  }

  if (!statusPageId) {
    return c.json(
      { data: null, success: false, error: "Status page ID is required" },
      400
    );
  }

  try {
    const { data: statusPage, error: statusPageError } = await supabase
      .from("status_pages")
      .select(
        `
        *,
        workspace:workspaces(id, name)
      `
      )
      .eq("id", statusPageId)
      .single();

    if (statusPageError) {
      if (statusPageError.code === "PGRST116") {
        return c.json(
          { data: null, success: false, error: "Status page not found" },
          404
        );
      }

      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching status page",
          details: statusPageError.message,
        },
        500
      );
    }

    if (!statusPage) {
      return c.json(
        { data: null, success: false, error: "Status page not found" },
        404
      );
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", statusPage.workspace_id)
      .eq("user_id", userId)
      .single();

    if (!membership) {
      return c.json(
        { data: null, success: false, error: "Access denied" },
        403
      );
    }

    return c.json({
      data: statusPage,
      success: true,
      error: null,
    });
  } catch (err) {
    console.error(
      `Unexpected error fetching status page ${statusPageId}:`,
      err
    );
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
