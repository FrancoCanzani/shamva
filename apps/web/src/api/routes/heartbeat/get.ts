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
      .select("id, status, workspace_id")
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

          try {
        const { error: logError } = await supabase
          .from("logs")
          .insert({
            workspace_id: heartbeat.workspace_id,
            monitor_id: null,
            heartbeat_id: heartbeat.id,
            url: c.req.url,
            status_code: 200,
            ok: true,
            latency: 0,
            headers: null,
            body_content: null,
            error: null,
            method: "GET",
            region: c.req.header("cf-ipcountry") || null,
            check_type: "heartbeat",
            tcp_host: null,
            tcp_port: null,
          })
          .select();

      if (logError) {
        console.error("Failed to log heartbeat event:", logError);
      }
    } catch (logInsertError) {
      console.error("Error logging heartbeat event:", logInsertError);
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
