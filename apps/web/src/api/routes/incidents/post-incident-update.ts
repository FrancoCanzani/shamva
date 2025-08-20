import { Context } from "hono";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";

const IncidentUpdatePostSchema = z.object({
  content: z.string().min(1).max(2000),
  authorName: z.string().min(1).max(200),
  authorEmail: z.email().max(200),
});

export default async function postIncidentUpdate(c: Context) {
  const userId = c.get("userId");
  const incidentId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!incidentId) {
    return c.json({ success: false, error: "Incident ID is required" }, 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { success: false, error: "Invalid JSON payload provided." },
      400
    );
  }

  const result = IncidentUpdatePostSchema.safeParse(rawBody);
  if (!result.success) {
    return c.json(
      {
        success: false,
        error: "Validation failed",
        details: result.error.issues,
      },
      400
    );
  }

  const { content, authorName, authorEmail } = result.data;

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select("monitor_id")
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
    return c.json(
      { success: false, error: "Monitor not found for incident" },
      404
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role, user_id")
    .eq("workspace_id", monitor.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("incident_updates")
    .insert({
      incident_id: incidentId,
      author_id: userId,
      author_name: authorName,
      author_email: authorEmail,
      content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return c.json(
      {
        success: false,
        error: "Failed to add update",
        details: insertError.message,
      },
      500
    );
  }

  return c.json({ data: inserted, success: true });
}
