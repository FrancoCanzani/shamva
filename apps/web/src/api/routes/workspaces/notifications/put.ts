import { Context } from "hono";
import { createSupabaseClient } from "../../../lib/supabase/client";
import { NotificationUpdateSchema } from "../../../lib/schemas";

export default async function putWorkspaceNotifications(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

  if (!workspaceId) {
    return c.json({ success: false, error: "Workspace ID is required." }, 400);
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

  const result = NotificationUpdateSchema.safeParse(rawBody);

  if (!result.success) {
    console.error("Validation Error Details:", result.error.issues);
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.issues,
      },
      400
    );
  }

  const supabase = createSupabaseClient(c.env);

  try {
    const { data: userMembership, error: userMembershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (
      userMembershipError ||
      !userMembership ||
      userMembership.role === "viewer"
    ) {
      return c.json(
        {
          success: false,
          error: "You do not have permission to edit notification settings for this workspace.",
        },
        403
      );
    }

    const updateData = {
      ...result.data,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedConfig, error: updateError } = await supabase
      .from("notifications")
      .update(updateData)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error(
        `Error updating notification config for workspace ${workspaceId}:`,
        updateError
      );
      return c.json(
        {
          success: false,
          error: "Failed to update notification configuration",
          details: updateError.message,
        },
        500
      );
    }

    return c.json({
      data: updatedConfig,
      success: true,
    });
  } catch (error) {
    console.error(
      `Unexpected error updating notification config for workspace ${workspaceId}:`,
      error
    );
    return c.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      500
    );
  }
}
