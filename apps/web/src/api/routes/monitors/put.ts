import { Context } from "hono";
import { MonitorsParamsSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function putMonitors(c: Context) {
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
      400
    );
  }

  const result = MonitorsParamsSchema.safeParse(rawBody);

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.flatten(),
      },
      400
    );
  }

  const {
    name,
    checkType,
    url,
    tcpHostPort,
    method,
    headers,
    body,
    headersString,
    bodyString,
    regions,
    interval,
    slackWebhookUrl,
  } = result.data;
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
      500
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

    // Parse headers and body from strings if provided
    let parsedHeaders: Record<string, string> | undefined = headers;
    if (headersString && !headers) {
      try {
        parsedHeaders = JSON.parse(headersString);
      } catch {
        return c.json({ success: false, error: "Invalid headers JSON format." }, 400);
      }
    }

    let parsedBody: Record<string, unknown> | string | undefined = body;
    if (bodyString && !body) {
      try {
        parsedBody = JSON.parse(bodyString);
      } catch {
        return c.json({ success: false, error: "Invalid body JSON format." }, 400);
      }
    }

    const updateData = {
      name,
      check_type: checkType,
      url: checkType === "http" ? url : null,
      tcp_host_port: checkType === "tcp" ? tcpHostPort : null,
      method: checkType === "http" ? method : null,
      headers: parsedHeaders ?? {},
      body: parsedBody,
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
        500
      );
    }

    return c.json({
      data: updatedMonitor,
      success: true,
    });
  } catch (error) {
    console.error("Error updating monitor:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update monitor",
        details: String(error),
      },
      500
    );
  }
}
