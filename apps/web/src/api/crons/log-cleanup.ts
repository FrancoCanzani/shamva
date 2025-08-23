import { supabase } from "../lib/supabase/client";

export async function handleLogCleanupCron(): Promise<void> {
  console.log("Starting log cleanup cron job at", new Date().toISOString());

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString();

    console.log(`Deleting logs older than ${cutoffDate}`);

    const { error } = await supabase
      .from("logs")
      .delete()
      .lt("created_at", cutoffDate);

    if (error) {
      console.error("Failed to delete old logs:", error);
      return;
    }

    console.log("Successfully deleted old log entries (older than 90 days)");

    console.log("Completed log cleanup cron job at", new Date().toISOString());
  } catch (error) {
    console.error("Critical error in log cleanup cron:", error);
  }
}
