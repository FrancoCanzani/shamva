import { Context } from "hono";
import { supabase } from "../../lib/supabase/client";

export default async function deleteCollectors(c: Context) {
  const userId = c.get("userId");
  const collectorId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!collectorId) {
    return c.json({ success: false, error: "Collector ID is required" }, 400);
  }

  const { data: existingCollector, error: fetchError } = await supabase
    .from("collectors")
    .select("*")
    .eq("id", collectorId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ success: false, error: "Collector not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error fetching collector",
        details: fetchError.message,
      },
      500
    );
  }

  if (!existingCollector) {
    return c.json({ success: false, error: "Collector not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", existingCollector.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Collector not found" }, 404);
  }

  if (membership.role === "viewer") {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  try {
    const { error: deleteError } = await supabase
      .from("collectors")
      .delete()
      .eq("id", collectorId);

    if (deleteError) {
      console.error("Error deleting collector:", deleteError);
      return c.json(
        {
          success: false,
          error: "Failed to delete collector",
          details: deleteError.message,
        },
        500
      );
    }

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting collector:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete collector",
        details: String(error),
      },
      500
    );
  }
}
