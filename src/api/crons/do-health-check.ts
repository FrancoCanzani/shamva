import { EnvBindings } from "../../../bindings";
import { createSupabaseClient } from "../lib/supabase/client";
import { InitializeCheckerDOPayload } from "../lib/types";

export async function doHealthCheck(env: EnvBindings, scheduledTime: number) {
  console.log(
    `Running scheduled DO health check: ${new Date(scheduledTime).toISOString()}`,
  );

  const supabase = createSupabaseClient(env);

  try {
    const { data: monitors, error: monitorsError } = await supabase
      .from("monitors")
      .select(
        `
        id,
        url,
        method,
        interval,
        regions,
        status,
        user_id,
        monitor_checkers(id, region, do_id, status, last_check_at, error_message)
      `,
      )
      .eq("status", "active");

    if (monitorsError) {
      console.error("Error fetching monitors for health check:", monitorsError);
      return;
    }

    if (!monitors || monitors.length === 0) {
      console.log("No active monitors found to check");
      return;
    }

    console.log(`Found ${monitors.length} active monitors to check`);

    const stats = {
      monitorsChecked: monitors.length,
      monitorsWithIssues: 0,
      dosRecreated: 0,
      recoveryErrors: 0,
    };

    const MAX_RECOVERY_PER_RUN = 25;
    let recoveryAttempts = 0;

    for (const monitor of monitors) {
      if (recoveryAttempts >= MAX_RECOVERY_PER_RUN) {
        console.log(
          `Reached maximum recovery attempts (${MAX_RECOVERY_PER_RUN}), will continue in next run`,
        );
        break;
      }

      const checkers = monitor.monitor_checkers || [];
      const monitorRegions = monitor.regions || [];
      let monitorHasIssues = false;

      for (const region of monitorRegions) {
        const checker = checkers.find((c) => c.region === region);

        const needsRecovery =
          !checker ||
          checker.status === "error" ||
          checker.status === "inactive";

        if (needsRecovery) {
          monitorHasIssues = true;
          console.log(
            `Monitor ${monitor.id} needs recovery for region ${region}: ${checker ? checker.status : "missing"}`,
          );

          if (recoveryAttempts >= MAX_RECOVERY_PER_RUN) continue;

          try {
            const doName = `${monitor.id}-${region}`;
            const doId = env.CHECKER_DURABLE_OBJECT.idFromName(doName);
            const doIdString = doId.toString();

            if (checker) {
              await supabase
                .from("monitor_checkers")
                .update({
                  status: "active",
                  error_message: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", checker.id);
            } else {
              await supabase.from("monitor_checkers").insert({
                monitor_id: monitor.id,
                region: region,
                do_id: doIdString,
                status: "active",
              });
            }

            const doStub = env.CHECKER_DURABLE_OBJECT.get(doId, {
              locationHint: region,
            });

            const initPayload: InitializeCheckerDOPayload = {
              urlToCheck: monitor.url,
              monitorId: monitor.id,
              userId: monitor.user_id,
              intervalMs: monitor.interval,
              method: monitor.method,
              region: region,
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await doStub.fetch("http://do.com/initialize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(initPayload),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `DO init failed (Region: ${region}, Status: ${response.status}): ${errorText}`,
              );
            }

            console.log(
              `Successfully recovered DO for monitor ${monitor.id} in region ${region}`,
            );
            stats.dosRecreated++;
            recoveryAttempts++;
          } catch (error) {
            console.error(
              `Error recovering DO for monitor ${monitor.id} in region ${region}:`,
              error,
            );
            stats.recoveryErrors++;

            if (checker) {
              await supabase
                .from("monitor_checkers")
                .update({
                  status: "error",
                  error_message: `Recovery failed: ${error instanceof Error ? error.message : String(error)}`,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", checker.id);
            }
          }
        }
      }

      if (monitorHasIssues) {
        stats.monitorsWithIssues++;
      }
    }

    console.log(`DO health check completed: ${JSON.stringify(stats)}`);
  } catch (error) {
    console.error("Unexpected error during DO health check:", error);
  }
}
