import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getIncident(c: Context) {
  const userId = c.get("userId");
  const incidentId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!incidentId) {
    return c.json({ success: false, error: "Incident ID is required" }, 400);
  }

  const supabase = createSupabaseClient(c.env);

  try {
    const { data: incident, error: fetchError } = await supabase
      .from("incidents")
      .select(`
        *,
        monitors (
          id,
          name,
          url,
          workspace_id
        )
      `)
      .eq("id", incidentId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return c.json({ success: false, error: "Incident not found" }, 404);
      }

      return c.json(
        {
          success: false,
          error: "Failed to fetch incident",
          details: fetchError.message,
        },
        500,
      );
    }

    if (!incident) {
      return c.json({ success: false, error: "Incident not found" }, 404);
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", incident.monitors.workspace_id)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      return c.json({ success: false, error: "Incident not found" }, 404);
    }

    return c.json({
      data: incident,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching incident:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch incident",
        details: String(error),
      },
      500,
    );
  }
} 