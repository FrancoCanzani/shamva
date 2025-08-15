import { Context } from "hono";
import { IncidentUpdateSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function putIncident(c: Context) {
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

  const result = IncidentUpdateSchema.safeParse(rawBody);

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.issues,
      },
      400
    );
  }

  const { acknowledged_at, post_mortem, resolved_at } = result.data;
  const supabase = createSupabaseClient(c.env);

  const { data: existingIncident, error: fetchError } = await supabase
    .from("incidents")
    .select(
      `
      *,
      monitors (
        id,
        name,
        url,
        workspace_id
      )
    `
    )
    .eq("id", incidentId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ success: false, error: "Incident not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error fetching incident",
        details: fetchError.message,
      },
      500
    );
  }

  if (!existingIncident) {
    return c.json({ success: false, error: "Incident not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", existingIncident.monitors.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Incident not found" }, 404);
  }

  if (membership.role === "viewer") {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (acknowledged_at !== undefined) {
      updateData.acknowledged_at = acknowledged_at;
    }
    if (resolved_at !== undefined) {
      updateData.resolved_at = resolved_at;
    }
    if (post_mortem !== undefined) {
      updateData.post_mortem = post_mortem;
    }

    const { data: updatedIncident, error: updateError } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", incidentId)
      .select(
        `
        *,
        monitors (
          id,
          name,
          url,
          workspace_id
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating incident:", updateError);
      return c.json(
        {
          success: false,
          error: "Failed to update incident",
          details: updateError.message,
        },
        500
      );
    }

    return c.json({
      data: updatedIncident,
      success: true,
    });
  } catch (error) {
    console.error("Error updating incident:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update incident",
        details: String(error),
      },
      500
    );
  }
}
