import { Context } from "hono";
import { MonitorsParamsSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";
import { MonitorsParams } from "../../lib/types";

export default async function postMonitors(c: Context) {
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
    console.error("Validation Error Details:", result.error.flatten());
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
    regions,
    interval,
    workspaceId,
    slackWebhookUrl,
  }: MonitorsParams = result.data;
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

  if (!workspaceId) {
    return c.json({ success: false, error: "Workspace ID is required." }, 400);
  }

  const supabase = createSupabaseClient(c.env);

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
      403
    );
  }

  if (membership.role === "viewer") {
    return c.json(
      {
        success: false,
        error:
          "Viewers cannot create monitors. Contact a workspace admin or member.",
      },
      403
    );
  }

  try {
    const { data, error: insertError } = await supabase
      .from("monitors")
      .insert([
        {
          name: name,
          check_type: checkType,
          url: url,
          tcp_host_port: tcpHostPort,
          method: method,
          headers: headers ?? {},
          body: body,
          user_id: userId,
          workspace_id: workspaceId,
          interval: interval ?? 5 * 60000,
          status: "initializing",
          regions: regions,
          slack_webhook_url: slackWebhookUrl,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase monitor insert error:", insertError);
      throw new Error(
        `Failed to create monitor record: ${insertError.message}`
      );
    }

    if (!data) {
      throw new Error("Failed to create monitor record: No data returned.");
    }


    console.log(
      `Monitor record created in database. ID: ${data.id}`
    );

    return c.json({
      data: data,
      success: true,
    });
  } catch (error) {
    console.error("Error during monitor database creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to create monitor in database.",
        details: String(error),
      },
      500
    );
  }
}
