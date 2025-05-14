import { Context } from "hono";
import { MonitorsParamsSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";
import {
  InitializeCheckerDOPayload,
  Monitor,
  MonitorsParams,
} from "../../lib/types";

export default async function postMonitors(c: Context) {
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

  const {
    name,
    url,
    method,
    headers,
    body,
    regions,
    interval,
    workspaceId,
  }: MonitorsParams = result.data;
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

  // Verify the user has permission for this workspace
  if (!workspaceId) {
    return c.json({ success: false, error: "Workspace ID is required." }, 400);
  }

  const supabase = createSupabaseClient(c.env);

  // Check if user has permission to create in this workspace
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return c.json(
      {
        success: false,
        error:
          "You do not have permission to create monitors in this workspace.",
      },
      403,
    );
  }

  if (membership.role === "viewer") {
    return c.json(
      {
        success: false,
        error:
          "Viewers cannot create monitors. Contact a workspace admin or member.",
      },
      403,
    );
  }

  let createdMonitor: Monitor | null = null;

  try {
    const { data, error: insertError } = await supabase
      .from("monitors")
      .insert([
        {
          name: name,
          url: url,
          method: method,
          headers: headers ?? {},
          body: body,
          user_id: userId,
          workspace_id: workspaceId,
          interval: interval ?? 5 * 60000,
          status: "active",
          regions: regions,
          failure_count: 0,
          success_count: 0,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase monitor insert error:", insertError);
      throw new Error(
        `Failed to create monitor record: ${insertError.message}`,
      );
    }

    if (!data) {
      throw new Error("Failed to create monitor record: No data returned.");
    }

    createdMonitor = data as Monitor;

    console.log(
      `Monitor record created in database. ID: ${createdMonitor!.id}`,
    );
  } catch (error) {
    console.error("Error during monitor database creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to create monitor in database.",
        details: String(error),
      },
      500,
    );
  }

  for (const region of regions) {
    const doName = `${createdMonitor.id}-${region}`;
    const doId = c.env.CHECKER_DURABLE_OBJECT.idFromName(doName);
    const doIdString = doId.toString();

    try {
      const { data: checkerData, error: checkerInsertError } = await supabase
        .from("monitor_checkers")
        .insert({
          monitor_id: createdMonitor.id,
          region: region,
          do_id: doIdString,
          status: "active",
        })
        .select("id")
        .single();

      if (checkerInsertError) {
        console.error(
          `Failed to insert checker record for region ${region}:`,
          checkerInsertError,
        );
        throw new Error(
          `DB error for region ${region}: ${checkerInsertError.message}`,
        );
      }
      if (!checkerData) {
        throw new Error(`No ID returned for checker record region ${region}`);
      }

      const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId, {
        locationHint: region,
      });

      const initPayload: InitializeCheckerDOPayload = {
        urlToCheck: createdMonitor.url,
        monitorId: createdMonitor.id,
        userId: userId,
        intervalMs: createdMonitor.interval,
        method: method,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Error initializing checker for region ${region} (Monitor: ${createdMonitor.id}):`,
        errorMessage,
      );

      await supabase
        .from("monitor_checkers")
        .update({ status: "error", error_message: errorMessage })
        .eq("do_id", doIdString);
    }
  }

  return c.json({
    data: createdMonitor,
    success: true,
  });
}
