import { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";
import { Context } from "hono";
import { supabase } from "../../../../lib/supabase/client";
import { Notifications } from "../../../../lib/types";

export default async function getWorkspaceNotifications(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");

  if (!workspaceId) {
    return c.json(
      { data: null, success: false, error: "Workspace ID is required" },
      400
    );
  }

  try {
    const { data: membershipData, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membershipData) {
      console.warn(
        `Access denied to workspace ${workspaceId} for user ${userId}`
      );
      return c.json(
        {
          data: null,
          success: false,
          error: "Access denied to workspace",
        },
        403
      );
    }

    const {
      data: notificationsData,
      error: notificationsError,
    }: PostgrestSingleResponse<Notifications> = await supabase
      .from("notifications")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (notificationsError) {
      if ((notificationsError as PostgrestError).code === "PGRST116") {
        console.log(
          `No notification config found for workspace ${workspaceId}, creating default`
        );

        const defaultConfig = {
          workspace_id: workspaceId,
          email_enabled: true,
          slack_enabled: false,
          slack_webhook_url: null,
          slack_channel: null,
          discord_enabled: false,
          discord_webhook_url: null,
          discord_channel: null,
          pagerduty_enabled: false,
          pagerduty_service_id: null,
          pagerduty_api_key: null,
          pagerduty_from_email: null,
          sms_enabled: false,
          sms_phone_numbers: null,
          twilio_account_sid: null,
          twilio_auth_token: null,
          twilio_from_number: null,
          whatsapp_enabled: false,
          whatsapp_phone_numbers: null,
          github_enabled: false,
          github_owner: null,
          github_repo: null,
          github_token: null,
        };

        const { data: newConfig, error: createError } = await supabase
          .from("notifications")
          .insert([defaultConfig])
          .select()
          .single();

        if (createError) {
          console.error(
            `Error creating default notification config for workspace ${workspaceId}:`,
            createError
          );
          return c.json(
            {
              data: null,
              success: false,
              error: "Failed to create notification configuration",
              details: createError.message,
            },
            500
          );
        }

        return c.json({
          data: newConfig,
          success: true,
        });
      }

      console.error(
        `Database error fetching notification config for workspace ${workspaceId}:`,
        notificationsError
      );
      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching notification configuration",
          details: notificationsError.message,
        },
        500
      );
    }

    return c.json({
      data: notificationsData,
      success: true,
    });
  } catch (error) {
    console.error(
      `Unexpected error fetching notification config for workspace ${workspaceId}:`,
      error
    );
    return c.json(
      {
        data: null,
        success: false,
        error: "An unexpected error occurred",
      },
      500
    );
  }
}
