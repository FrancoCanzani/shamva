import { Context } from "hono";
import { HeartbeatSchema } from "../../lib/schemas";
import { supabase } from "../../lib/supabase/client";

export default async function putHeartbeat(c: Context) {
  const heartbeatId = c.req.param("id");

  if (!heartbeatId) {
    return c.json({ success: false, error: "Heartbeat ID is required." }, 400);
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

  const result = HeartbeatSchema.safeParse(rawBody);

  if (!result.success) {
    console.error("Validation Error Details:", result.error.issues);
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.issues,
      },
      400
    );
  }

  const { name, expectedLapseMs, gracePeriodMs, workspaceId, pingId } =
    result.data;

  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

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
        error:
          "You do not have permission to update heartbeats in this workspace.",
      },
      403
    );
  }

  if (membership.role === "viewer") {
    return c.json(
      {
        success: false,
        error:
          "Viewers cannot update heartbeats. Contact a workspace admin or member.",
      },
      403
    );
  }

  const { data: existingHeartbeat, error: fetchError } = await supabase
    .from("heartbeats")
    .select("id, workspace_id")
    .eq("id", heartbeatId)
    .single();

  if (fetchError || !existingHeartbeat) {
    return c.json({ success: false, error: "Heartbeat not found." }, 404);
  }

  if (existingHeartbeat.workspace_id !== workspaceId) {
    return c.json(
      { success: false, error: "Heartbeat does not belong to this workspace." },
      403
    );
  }

  try {
    const { data: heartbeat, error } = await supabase
      .from("heartbeats")
      .update({
        name,
        ping_id: pingId,
        expected_lapse_ms: expectedLapseMs,
        grace_period_ms: gracePeriodMs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", heartbeatId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update heartbeat:", error);
      return c.json(
        { success: false, error: "Failed to update heartbeat." },
        500
      );
    }

    return c.json({
      success: true,
      data: heartbeat,
    });
  } catch (error) {
    console.error("Error updating heartbeat:", error);
    return c.json({ success: false, error: "Internal server error." }, 500);
  }
}
