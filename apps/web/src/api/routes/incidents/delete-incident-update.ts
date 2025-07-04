import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function deleteIncidentUpdate(c: Context) {
  const userId = c.get("userId");
  const incidentId = c.req.param("id");
  const updateId = c.req.param("updateId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }
  if (!incidentId || !updateId) {
    return c.json(
      { success: false, error: "Incident ID and Update ID are required" },
      400
    );
  }

  const supabase = createSupabaseClient(c.env);

  const { data: update, error: updateError } = await supabase
    .from("incident_updates")
    .select("id, author_id, incident_id")
    .eq("id", updateId)
    .eq("incident_id", incidentId)
    .single();

  if (updateError || !update) {
    return c.json({ success: false, error: "Update not found" }, 404);
  }

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("id, monitor_id")
    .eq("id", incidentId)
    .single();

  if (incidentError || !incident) {
    return c.json({ success: false, error: "Incident not found" }, 404);
  }

  const { data: monitor, error: monitorError } = await supabase
    .from("monitors")
    .select("workspace_id")
    .eq("id", incident.monitor_id)
    .single();

  if (monitorError || !monitor) {
    return c.json({ success: false, error: "Monitor not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", monitor.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json(
      { success: false, error: "Workspace membership not found" },
      404
    );
  }

  const isAdmin = membership && membership.role === "admin";
  const isAuthor = update.author_id === userId;

  if (!isAdmin && !isAuthor) {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  const { error: deleteError } = await supabase
    .from("incident_updates")
    .delete()
    .eq("id", updateId)
    .eq("incident_id", incidentId);

  if (deleteError) {
    return c.json(
      {
        success: false,
        error: "Failed to delete update",
        details: deleteError.message,
      },
      500
    );
  }

  return c.json({ success: true });
}
