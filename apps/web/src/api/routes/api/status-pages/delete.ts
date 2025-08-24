import { Context } from "hono";
import { supabase } from "../../../lib/supabase/client";

export default async function deleteStatusPages(c: Context) {
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
    const { data: statusPage, error: fetchError } = await supabase
      .from("status_pages")
      .select("workspace_id")
      .eq("id", statusPageId)
      .single();

    if (fetchError || !statusPage) {
      return c.json({ success: false, error: "Status page not found" }, 404);
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", statusPage.workspace_id)
      .eq("user_id", userId)
      .single();

    if (!membership || membership.role === "viewer") {
      return c.json({ success: false, error: "Insufficient permissions" }, 403);
    }

    const { data, error } = await supabase
      .from("status_pages")
      .delete()
      .eq("id", statusPageId)
      .single();

    if (error) {
      return c.json(
        {
          success: false,
          error: "Database error deleting status page",
          details: error.message,
        },
        500
      );
    }

    return c.json(
      {
        data,
        success: true,
        message: "Status page deleted",
      },
      200
    );
  } catch (unexpectedError) {
    console.error("Unexpected error deleting status page:", unexpectedError);
    return c.json(
      {
        success: false,
        error: "Unexpected error deleting status page",
        details: String(unexpectedError),
      },
      500
    );
  }
}
