import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function deleteHeartbeat(c: Context) {
  const heartbeatId = c.req.param("id");

  if (!heartbeatId) {
    return c.json(
      { success: false, error: "Heartbeat ID is required." },
      400
    );
  }

  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

  const supabase = createSupabaseClient(c.env);

  const { data: heartbeat, error: fetchError } = await supabase
    .from("heartbeats")
    .select("id, workspace_id")
    .eq("id", heartbeatId)
    .single();

  if (fetchError || !heartbeat) {
    return c.json(
      { success: false, error: "Heartbeat not found." },
      404
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", heartbeat.workspace_id)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return c.json(
      {
        success: false,
        error:
          "You do not have permission to delete heartbeats in this workspace.",
      },
      403
    );
  }

  if (membership.role === "viewer") {
    return c.json(
      {
        success: false,
        error:
          "Viewers cannot delete heartbeats. Contact a workspace admin or member.",
      },
      403
    );
  }

  try {
    const { error } = await supabase
      .from("heartbeats")
      .delete()
      .eq("id", heartbeatId);

    if (error) {
      console.error("Failed to delete heartbeat:", error);
      return c.json(
        { success: false, error: "Failed to delete heartbeat." },
        500
      );
    }

    return c.json({
      success: true,
      message: "Heartbeat deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting heartbeat:", error);
    return c.json(
      { success: false, error: "Internal server error." },
      500
    );
  }
} 