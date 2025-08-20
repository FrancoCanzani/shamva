import { Context } from "hono";
import { HeartbeatSchema } from "../../lib/schemas";
import { supabase } from "../../lib/supabase/client";

export default async function postHeartbeat(c: Context) {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { data: null, success: false, error: "Invalid JSON payload provided." },
      400
    );
  }

  const result = HeartbeatSchema.safeParse(rawBody);
  if (!result.success) {
    return c.json(
      {
        data: null,
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.issues,
      },
      400
    );
  }

  const { workspaceId } = result.data;

  const userId = c.get("userId");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return c.json(
      {
        data: null,
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
        data: null,
        success: false,
        error:
          "Viewers cannot create heartbeats. Contact a workspace admin or member.",
      },
      403
    );
  }

  try {
    const { data, error: insertError } = await supabase
      .from("heartbeats")
      .insert([
        {
          workspace_id: result.data.workspaceId,
          ping_id: result.data.pingId,
          name: result.data.name,
          expected_lapse_ms: result.data.expectedLapseMs,
          grace_period_ms: result.data.gracePeriodMs,
          status: "idle",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase heartbeat insert error:", insertError);
      throw new Error(
        `Failed to create heartbeat record: ${insertError.message}`
      );
    }

    if (!data) {
      throw new Error("Failed to create heartbeat record: No data returned.");
    }

    return c.json({
      data: data,
      success: true,
    });
  } catch (error) {
    console.error("Error during heartbeat database creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to create heartbeat in database.",
        details: String(error),
      },
      500
    );
  }
}
