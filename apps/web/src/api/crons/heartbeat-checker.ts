import { EnvBindings } from "../../../bindings";
import { supabase } from "../lib/supabase/client";
import { Heartbeat } from "../lib/types";

export async function handleHeartbeatCheckerCron(
  env: EnvBindings
): Promise<void> {
  console.log(
    "Starting heartbeat checker cron job at",
    new Date().toISOString()
  );

  try {
    const { data: heartbeats, error } = await supabase.rpc(
      "get_timed_out_heartbeats"
    );

    if (error) {
      console.error("Failed to fetch timed out heartbeats:", error);
      return;
    }

    console.log(
      `Found ${heartbeats?.length || 0} timed out heartbeats:`,
      heartbeats?.map((h: Heartbeat) => ({
        id: h.id,
        name: h.name,
        timeout_ms: h.expected_lapse_ms + h.grace_period_ms,
      }))
    );

    if (!heartbeats || heartbeats.length === 0) {
      console.log("No timed out heartbeats");
      return;
    }

    for (const heartbeat of heartbeats) {
      try {
        await supabase
          .from("heartbeats")
          .update({
            status: "timeout",
            updated_at: new Date().toISOString(),
          })
          .eq("id", heartbeat.id);

        console.log(
          `Heartbeat ${heartbeat.id} (${heartbeat.name}) has timed out`
        );

        try {
          const { error: logError } = await supabase
            .from("logs")
            .insert({
              workspace_id: heartbeat.workspace_id,
              monitor_id: null,
              heartbeat_id: heartbeat.id,
              url: null,
              status_code: 408,
              ok: false,
              latency: 0,
              headers: null,
              body_content: null,
              error: `Heartbeat ${heartbeat.name} timed out after ${heartbeat.expected_lapse_ms + heartbeat.grace_period_ms}ms`,
              method: null,
              region: null,
              check_type: "heartbeat",
              tcp_host: null,
              tcp_port: null,
            })
            .select();

          if (logError) {
            console.error("Failed to log heartbeat timeout:", logError);
          }
        } catch (logInsertError) {
          console.error("Error logging heartbeat timeout:", logInsertError);
        }

        await sendHeartbeatAlert(env, heartbeat);
      } catch (error) {
        console.error(
          `Error processing timed out heartbeat ${heartbeat.id}:`,
          error
        );
      }
    }

    console.log(
      "Completed heartbeat checker cron job at",
      new Date().toISOString()
    );
  } catch (error) {
    console.error("Critical error in heartbeat checker cron:", error);
  }
}

async function sendHeartbeatAlert(
  env: EnvBindings,
  heartbeat: Heartbeat
): Promise<void> {
  try {
    const { data: workspaceMembers } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", heartbeat.workspace_id)
      .eq("invitation_status", "accepted");

    if (!workspaceMembers || workspaceMembers.length === 0) {
      console.warn(
        `No workspace members found for workspace ${heartbeat.workspace_id}`
      );
      return;
    }

    const userEmails = workspaceMembers.map((member) => member.user_id);

    console.log(`Heartbeat alert for ${heartbeat.name}:`, {
      heartbeatId: heartbeat.id,
      name: heartbeat.name,
      timeoutMs: heartbeat.expected_lapse_ms + heartbeat.grace_period_ms,
      userEmails,
    });
  } catch (error) {
    console.error("Failed to send heartbeat alert:", error);
  }
}
