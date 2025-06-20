import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getAllIncidents(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.query("workspaceId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!workspaceId) {
    return c.json({ success: false, error: "Workspace ID is required" }, 400);
  }

  const supabase = createSupabaseClient(c.env);

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Workspace not found" }, 404);
  }

  try {
    const { data: incidents, error: fetchError } = await supabase
      .from("incidents")
      .select(
        `
        *,
        monitors (
          id,
          name,
          url
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching incidents:", fetchError);
      return c.json(
        {
          success: false,
          error: "Failed to fetch incidents",
          details: fetchError.message,
        },
        500
      );
    }

    return c.json({
      data: incidents,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch incidents",
        details: String(error),
      },
      500
    );
  }
}
