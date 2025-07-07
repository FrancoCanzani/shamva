import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";
import { HeartbeatSchema } from "../../lib/schemas";

export default async function postHeartbeat(c: Context) {
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
    console.error("Validation Error Details:", result.error.flatten());
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.flatten(),
      },
      400
    );
  }

  const {
    name,
    expected_lapse_ms,
    grace_period_ms,
    workspace_id,
  } = result.data;

  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

  const supabase = createSupabaseClient(c.env);

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return c.json(
      {
        success: false,
        error:
          "You do not have permission to create heartbeats in this workspace.",
      },
      403
    );
  }

  if (membership.role === "viewer") {
    return c.json(
      {
        success: false,
        error:
          "Viewers cannot create heartbeats. Contact a workspace admin or member.",
      },
      403
    );
  }

  try {
    const { data: heartbeat, error } = await supabase
      .from("heartbeats")
      .insert({
        name,
        expected_lapse_ms,
        grace_period_ms,
        workspace_id,
        status: "active",
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create heartbeat:", error);
      return c.json(
        { success: false, error: "Failed to create heartbeat." },
        500
      );
    }

    return c.json({
      success: true,
      data: heartbeat,
    });
  } catch (error) {
    console.error("Error creating heartbeat:", error);
    return c.json(
      { success: false, error: "Internal server error." },
      500
    );
  }
} 