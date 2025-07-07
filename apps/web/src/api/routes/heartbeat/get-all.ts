import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getAllHeartbeats(c: Context) {
  const workspaceId = c.req.query("workspaceId");

  if (!workspaceId) {
    return c.json(
      { success: false, error: "Workspace ID is required." },
      400
    );
  }

  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

  const supabase = createSupabaseClient(c.env);

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return c.json(
      {
        success: false,
        error: "You do not have access to this workspace.",
      },
      403
    );
  }

  try {
    const { data: heartbeats, error } = await supabase
      .from("heartbeats")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch heartbeats:", error);
      return c.json(
        { success: false, error: "Failed to fetch heartbeats." },
        500
      );
    }

    return c.json({
      success: true,
      data: heartbeats,
    });
  } catch (error) {
    console.error("Error fetching heartbeats:", error);
    return c.json(
      { success: false, error: "Internal server error." },
      500
    );
  }
} 