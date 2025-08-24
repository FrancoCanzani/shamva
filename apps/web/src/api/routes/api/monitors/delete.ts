import { Context } from "hono";
import { supabase } from "../../../lib/supabase/client";

export default async function deleteMonitors(c: Context) {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!monitorId) {
    return c.json({ success: false, error: "Monitor ID is required" }, 400);
  }

  const { data: existingMonitor, error: fetchError } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", monitorId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ success: false, error: "Monitor not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error fetching monitor",
        details: fetchError.message,
      },
      500
    );
  }

  if (!existingMonitor) {
    return c.json({ success: false, error: "Monitor not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", existingMonitor.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Monitor not found" }, 404);
  }

  if (membership.role === "viewer") {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  try {
    const { error: deleteError } = await supabase
      .from("monitors")
      .delete()
      .eq("id", monitorId);

    if (deleteError) {
      console.error("Error deleting monitor:", deleteError);
      return c.json(
        {
          success: false,
          error: "Failed to delete monitor",
          details: deleteError.message,
        },
        500
      );
    }

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting monitor:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete monitor",
        details: String(error),
      },
      500
    );
  }
}
