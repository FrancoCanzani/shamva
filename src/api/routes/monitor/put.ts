import { Context } from "hono";
import { MonitorsParamsSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Monitor } from "../../lib/types";

export default async function putMonitor(c: Context) {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!monitorId) {
    return c.json({ success: false, error: "Monitor ID is required" }, 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { success: false, error: "Invalid JSON payload provided." },
      400,
    );
  }

  const result = MonitorsParamsSchema.safeParse(rawBody);

  if (!result.success) {
    console.error("Validation Error Details:", result.error.flatten());
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.flatten(),
      },
      400,
    );
  }

  const { name, url, method, headers, body, regions, interval, slackWebhookUrl } = result.data;
  const supabase = createSupabaseClient(c.env);

  const { data: existingMonitor, error: fetchError } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", monitorId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ success: false, error: "Monitor not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error fetching monitor",
        details: fetchError.message,
      },
      500,
    );
  }

  if (!existingMonitor) {
    return c.json({ success: false, error: "Monitor not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", existingMonitor.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Monitor not found" }, 404);
  }

  if (membership.role === "viewer") {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  try {
    const finalInterval = interval ?? existingMonitor.interval;

    const updateData = {
      name,
      url,
      method,
      headers: headers ?? {},
      body,
      interval: finalInterval,
      regions,
      updated_at: new Date().toISOString(),
      slack_webhook_url: slackWebhookUrl,
    };

    const { data: updatedMonitor, error: updateError } = await supabase
      .from("monitors")
      .update(updateData)
      .eq("id", monitorId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating monitor:", updateError);
      return c.json(
        {
          success: false,
          error: "Failed to update monitor",
          details: updateError.message,
        },
        500,
      );
    }

    const existingRegions = new Set(existingMonitor.regions);
    const newRegions = new Set(regions);

    const regionsToAdd = regions.filter((r) => !existingRegions.has(r));

    const regionsToRemove = existingMonitor.regions.filter(
      (r: string) => !newRegions.has(r),
    );

    if (regionsToRemove.length > 0) {
      for (const region of regionsToRemove) {
        const doName = `${monitorId}-${region}`;
        const doId = c.env.CHECKER_DURABLE_OBJECT.idFromName(doName);

        try {
          const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId, {
            locationHint: region,
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await doStub.fetch("http://do.com/cleanup", {
            method: "DELETE",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(
              `DO cleanup failed for region ${region} (Monitor: ${monitorId}, Status: ${response.status}): ${errorText}`,
            );
          } else {
            console.log(
              `Successfully cleaned up DO for region ${region} (Monitor: ${monitorId})`,
            );
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `Error cleaning up DO for region ${region} (Monitor: ${monitorId}):`,
            errorMessage,
          );
        }

        try {
          const { error: updateCheckerError } = await supabase
            .from("monitor_checkers")
            .update({
              status: "inactive",
              error_message: "Region removed from monitor",
              updated_at: new Date().toISOString(),
            })
            .eq("monitor_id", monitorId)
            .eq("region", region);

          if (updateCheckerError) {
            console.error(
              `Error updating monitor_checker status for region ${region} (Monitor: ${monitorId}):`,
              updateCheckerError,
            );
          }
        } catch (dbError) {
          console.error(
            `Database error updating checker for region ${region} (Monitor: ${monitorId}):`,
            dbError,
          );
        }
      }
    }

    if (regionsToAdd.length > 0) {
      console.log(
        `Adding regions [${regionsToAdd.join(", ")}] to monitor ${monitorId}`,
      );

      for (const region of regionsToAdd) {
        const doName = `${monitorId}-${region}`;
        const doId = c.env.CHECKER_DURABLE_OBJECT.idFromName(doName);
        const doIdString = doId.toString();

        try {
          const { data: existingChecker } = await supabase
            .from("monitor_checkers")
            .select("*")
            .eq("monitor_id", monitorId)
            .eq("region", region)
            .single();

          if (existingChecker) {
            await supabase
              .from("monitor_checkers")
              .update({
                status: "active",
                error_message: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingChecker.id);
          } else {
            await supabase.from("monitor_checkers").insert({
              monitor_id: monitorId,
              region: region,
              do_id: doIdString,
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId, {
            locationHint: region,
          });

          const initPayload = {
            urlToCheck: url,
            monitorId: monitorId,
            userId: userId,
            intervalMs: finalInterval,
            method: method,
            region: region,
            headers: headers || undefined,
            body: body || undefined,
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
            `Successfully initialized DO for region ${region} (Monitor: ${monitorId})`,
          );
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `Error initializing checker for region ${region} (Monitor: ${monitorId}):`,
            errorMessage,
          );

          await supabase
            .from("monitor_checkers")
            .update({
              status: "error",
              error_message: errorMessage,
              updated_at: new Date().toISOString(),
            })
            .eq("do_id", doIdString);
        }
      }
    }

    const regionsToUpdate = regions.filter((r) => existingRegions.has(r));

    if (
      regionsToUpdate.length > 0 &&
      (url !== existingMonitor.url ||
        method !== existingMonitor.method ||
        JSON.stringify(headers) !== JSON.stringify(existingMonitor.headers) ||
        JSON.stringify(body) !== JSON.stringify(existingMonitor.body) ||
        finalInterval !== existingMonitor.interval)
    ) {
      console.log(
        `Updating configuration for regions [${regionsToUpdate.join(", ")}] in monitor ${monitorId}`,
      );

      for (const region of regionsToUpdate) {
        const doName = `${monitorId}-${region}`;
        const doId = c.env.CHECKER_DURABLE_OBJECT.idFromName(doName);

        try {
          const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId, {
            locationHint: region,
          });

          const initPayload = {
            urlToCheck: url,
            monitorId: monitorId,
            userId: userId,
            intervalMs: finalInterval,
            method: method,
            region: region,
            headers: headers || undefined,
            body: body || undefined,
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
              `DO update failed (Region: ${region}, Status: ${response.status}): ${errorText}`,
            );
          }

          console.log(
            `Successfully updated DO configuration for region ${region} (Monitor: ${monitorId})`,
          );
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `Error updating checker for region ${region} (Monitor: ${monitorId}):`,
            errorMessage,
          );

          await supabase
            .from("monitor_checkers")
            .update({
              status: "error",
              error_message: `Config update failed: ${errorMessage}`,
              updated_at: new Date().toISOString(),
            })
            .eq("monitor_id", monitorId)
            .eq("region", region);
        }
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const { data: recentLogs, error: logError } = await supabase
      .from("logs")
      .select("*")
      .eq("monitor_id", monitorId)
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: false })
      .limit(50);

    if (logError) {
      console.error(
        `Error fetching recent logs for monitor ${monitorId}:`,
        logError,
      );
      (updatedMonitor as Monitor).recent_logs = [];
    } else {
      (updatedMonitor as Monitor).recent_logs = recentLogs || [];
    }

    return c.json({
      data: updatedMonitor,
      success: true,
    });
  } catch (err) {
    console.error(`Error updating monitor ${monitorId}:`, err);
    const errorDetails = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        success: false,
        error: "Failed to update monitor",
        details: errorDetails,
      },
      500,
    );
  }
}
