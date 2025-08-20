import { Context } from "hono";
import { supabase } from "../../lib/supabase/client";

export default async function getIncident(c: Context) {
  const userId = c.get("userId");
  const incidentId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!incidentId) {
    return c.json({ success: false, error: "Incident ID is required" }, 400);
  }

  try {
    const [incidentResult, updatesResult] = await Promise.all([
      supabase
        .from("incidents")
        .select(
          `
          *,
          monitors (
            id,
            name,
            url,
            error_message,
            workspace_id
          )
        `
        )
        .eq("id", incidentId)
        .single(),
      supabase
        .from("incident_updates")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true }),
    ]);

    const { data: incident, error: fetchError } = incidentResult;
    const { data: updates, error: updatesError } = updatesResult;

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
        500
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

    if (updatesError) {
      return c.json(
        {
          success: false,
          error: "Failed to fetch updates",
          details: updatesError.message,
        },
        500
      );
    }

    return c.json({
      data: { ...incident, updates },
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
      500
    );
  }
}
