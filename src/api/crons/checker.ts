import { createSupabaseClient } from "../lib/supabase/client";
import type { EnvBindings } from "../../../bindings";

type Region = "wnam" | "enam" | "sam" | "weur" | "eeur" | "apac" | "oc" | "afr" | "me";

async function getWorkspaceUsers(env: EnvBindings, workspaceId: string): Promise<string[]> {
  try {
    const { data: workspaceUsers, error } = await createSupabaseClient(env)
      .from("workspace_users")
      .select("invitation_email")
      .eq("workspace_id", workspaceId)
      .eq("invitation_status", "accepted");

    if (error) throw error;

    return workspaceUsers?.map(u => u.invitation_email) || [];
  } catch (error) {
    console.error("Failed to get workspace users:", error);
    return [];
  }
}

export async function handleCheckerCron(env: EnvBindings): Promise<void> {

    console.log("Checking monitors");
    
  try {
    const { data: monitors, error } = await createSupabaseClient(env)
      .from("monitors")
      .select("*")
      .eq("active", true)
      .or(
        `last_check_at.is.null,` + // Never checked
        `extract(epoch from (now() - last_check_at)) >= interval` // Or enough time has passed
      );

    if (error) {
      console.error("Failed to fetch monitors:", error);
      return;
    }

    if (!monitors || monitors.length === 0) {
      console.log("No monitors to check");
      return;
    }

    const checkPromises = monitors.flatMap((monitor) => {
      // Default to a single check if no regions specified
      const regions = (monitor.regions as Region[]) || ["enam"];
      
      return regions.map(async (region: Region) => {
        try {
          const userEmails = await getWorkspaceUsers(env, monitor.workspace_id);
          if (userEmails.length === 0) {
            console.warn(`No users found for workspace ${monitor.workspace_id}`);
            return;
          }

          const id = env.CHECKER_DURABLE_OBJECT.idFromName(monitor.id);
          const obj = env.CHECKER_DURABLE_OBJECT.get(id, { locationHint: region });

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
              lastStatusCode: monitor.last_status_code,
              headers: monitor.headers,
              body: monitor.body,
              userEmails,
            }),
          });

          if (!response.ok) {
            console.error(`Failed to check monitor ${monitor.id} in region ${region}:`, await response.text());
          }
        } catch (error) {
          console.error(`Error checking monitor ${monitor.id} in region ${region}:`, error);
        }
      });
    });

    await Promise.allSettled(checkPromises);
  } catch (error) {
    console.error("Critical error in checker cron:", error);
  }
} 