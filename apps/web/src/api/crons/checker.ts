import { createSupabaseClient } from "../lib/supabase/client";
import type { EnvBindings } from "../../../bindings";
import type { Monitor, Region } from "../lib/types";

async function getWorkspaceUsers(
  env: EnvBindings,
  workspaceId: string
): Promise<string[]> {
  try {
    const { data: workspaceUsers, error } = await createSupabaseClient(env)
      .from("workspace_members")
      .select("invitation_email")
      .eq("workspace_id", workspaceId)
      .eq("invitation_status", "accepted");

    if (error) throw error;

    return workspaceUsers?.map((u) => u.invitation_email) || [];
  } catch (error) {
    console.error("Failed to get workspace users:", error);
    return [];
  }
}

export async function handleCheckerCron(env: EnvBindings): Promise<void> {
  console.log("Starting checker cron job at", new Date().toISOString());

  try {
    const { data: monitors, error } = await createSupabaseClient(env).rpc(
      "get_monitors_due_for_check"
    );

    if (error) {
      console.error("Failed to fetch monitors:", error);
      return;
    }

    console.log(
      `Found ${monitors?.length || 0} monitors to check:`,
      monitors?.map((m: Monitor) => ({
        id: m.id,
        name: m.name,
        interval: m.interval,
        last_check_at: m.last_check_at,
      }))
    );

    if (!monitors || monitors.length === 0) {
      console.log("No monitors to check");
      return;
    }

    const checkPromises = monitors.flatMap((monitor: Monitor) => {
      // Default to a single check if no regions specified
      const regions = (monitor.regions as Region[]) || ["enam"];
      console.log(
        `Processing monitor ${monitor.id} (${monitor.name}) with regions:`,
        regions
      );

      return regions.map(async (region: Region) => {
        try {
          const userEmails = await getWorkspaceUsers(env, monitor.workspace_id);
          console.log(
            `Found ${userEmails.length} users for workspace ${monitor.workspace_id}`
          );

          if (userEmails.length === 0) {
            console.warn(
              `No users found for workspace ${monitor.workspace_id}`
            );
            return;
          }

          const id = env.CHECKER_DURABLE_OBJECT.idFromName(monitor.id);
          const obj = env.CHECKER_DURABLE_OBJECT.get(id, {
            locationHint: region,
          });

          console.log(
            `Sending check request for monitor ${monitor.id} (${monitor.name}) in region ${region}`
          );
          const response = await obj.fetch("https://checker/check", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              monitorId: monitor.id,
              userId: monitor.user_id,
              workspaceId: monitor.workspace_id,
              urlToCheck: monitor.url,
              method: monitor.method,
              intervalMs: monitor.interval,
              region,
              createdAt: monitor.created_at,
              consecutiveFailures: monitor.failure_count,
              headers: monitor.headers,
              body: monitor.body,
              userEmails,
              status: monitor.status,
              errorMessage: monitor.error_message,
              name: monitor.name,
              slackWebhookUrl: monitor.slack_webhook_url,
            }),
          });

          if (!response.ok) {
            console.error(
              `Failed to check monitor ${monitor.id} in region ${region}:`,
              await response.text()
            );
          } else {
            console.log(
              `Successfully checked monitor ${monitor.id} (${monitor.name}) in region ${region}`
            );
          }
        } catch (error) {
          console.error(
            `Error checking monitor ${monitor.id} in region ${region}:`,
            error
          );
        }
      });
    });

    await Promise.allSettled(checkPromises);
    console.log("Completed checker cron job at", new Date().toISOString());
  } catch (error) {
    console.error("Critical error in checker cron:", error);
  }
}
