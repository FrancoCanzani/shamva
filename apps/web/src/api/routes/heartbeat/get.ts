import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function getHeartbeat(c: Context) {
  const heartbeatId = c.req.query("id");
  const serviceName = c.req.query("service");
  const metadata = c.req.query("metadata");

  if (!heartbeatId) {
    return c.json({ error: "Heartbeat ID is required" }, 400);
  }

  try {
    const supabase = createSupabaseClient(c.env);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("heartbeats")
      .upsert({
        id: heartbeatId,
        service_name: serviceName || "unknown",
        metadata: metadata ? JSON.parse(metadata) : null,
        last_beat_at: now,
        updated_at: now,
      });

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