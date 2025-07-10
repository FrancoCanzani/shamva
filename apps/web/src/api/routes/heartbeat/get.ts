import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getHeartbeat(c: Context) {
  const pingId = c.req.query("id");

  if (!pingId) {
    return c.json({ error: "Heartbeat ID is required" }, 400);
  }

  try {
    const supabase = createSupabaseClient(c.env);
    const now = new Date().toISOString();

    const { data: heartbeat, error: fetchError } = await supabase
      .from("heartbeats")
      .select("id, status")
      .eq("ping_id", pingId)
      .single();

    if (fetchError || !heartbeat) {
      return c.json({ error: "Heartbeat not found" }, 404);
    }

    const { error } = await supabase
      .from("heartbeats")
      .update({
        last_beat_at: now,
        updated_at: now,
        status: heartbeat.status === "idle" ? "active" : heartbeat.status,
      })
      .eq("ping_id", pingId);

    if (error) {
      console.error("Failed to log heartbeat:", error);
      return c.json({ error: "Failed to log heartbeat" }, 500);
    }

    return c.json({
      success: true,
      timestamp: now,
      message: "Heartbeat received",
    });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
