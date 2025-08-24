import { Context } from "hono";
import { z } from "zod";
import { supabase } from "../../../lib/supabase/client";

const MemberUpdateSchema = z.object({
  id: z.uuid().optional(),
  email: z
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  role: z.enum(["admin", "member", "viewer"], {
    error: "Please select a valid role",
  }),
  invitation_status: z.enum(["pending", "accepted", "declined"]).optional(),
  user_id: z.uuid().nullable().optional(),
});

const WorkspaceUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(100, "Workspace name cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Workspace name must be URL-friendly (lowercase letters, numbers, and hyphens, no leading/trailing/consecutive hyphens)"
    ),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  members: z.array(MemberUpdateSchema),
});

export default async function putWorkspaces(c: Context) {
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

    console.log("Rawbody:", rawBody);
  } catch {
    return c.json(
      { success: false, error: "Invalid JSON payload provided." },
      400
    );
  }

  const result = WorkspaceUpdateSchema.safeParse(rawBody);

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

  const { name, description, members: updatedMembers } = result.data;

  const { data: userMembership, error: userMembershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (
    userMembershipError ||
    !userMembership ||
    userMembership.role !== "admin"
  ) {
    return c.json(
      {
        success: false,
        error: "You do not have permission to edit this workspace.",
      },
      403
    );
  }

  const { data: currentMembers, error: currentMembersError } = await supabase
    .from("workspace_members")
    .select("id, user_id, invitation_email, role, invitation_status")
    .eq("workspace_id", workspaceId);

  if (currentMembersError) {
    console.error("Error fetching current members:", currentMembersError);
    return c.json(
      { success: false, error: "Database error fetching current members." },
      500
    );
  }

  const currentMembersMap = new Map(currentMembers?.map((m) => [m.id, m]));
  const currentMembersByEmail = new Map(
    currentMembers?.map((m) => [m.invitation_email, m])
  );
  const updatedMembersMap = new Map(
    updatedMembers.filter((m) => m.id).map((m) => [m.id, m])
  );

  const memberUpdates = [];
  const memberInserts = [];
  const memberDeletes = [];

  for (const updatedMember of updatedMembers) {
    if (updatedMember.id) {
      const currentMember = currentMembersMap.get(updatedMember.id);
      if (currentMember && currentMember.role !== updatedMember.role) {
        memberUpdates.push({
          id: updatedMember.id,
          role: updatedMember.role,
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      const existingMemberWithEmail = currentMembersByEmail.get(
        updatedMember.email
      );

      if (!existingMemberWithEmail) {
        const { data: existingUser } = await supabase
          .from("auth.users")
          .select("id")
          .eq("email", updatedMember.email)
          .single();

        memberInserts.push({
          workspace_id: workspaceId,
          user_id: existingUser?.id || null,
          role: updatedMember.role,
          invitation_email: updatedMember.email,
          invitation_status: "pending",
          invited_by: userId,
        });
      } else {
        console.warn(
          `Attempted to re-invite or add existing member ${updatedMember.email} to workspace ${workspaceId}. Existing member ID: ${existingMemberWithEmail.id}`
        );
      }
    }
  }

  for (const currentMember of currentMembers ?? []) {
    if (!updatedMembersMap.has(currentMember.id)) {
      const isStillInUpdatedListByEmail =
        !currentMember.id &&
        updatedMembers.some((m) => m.email === currentMember.invitation_email);

      if (!isStillInUpdatedListByEmail) {
        if (
          currentMember.role === "admin" &&
          currentMember.invitation_status === "accepted"
        ) {
          const remainingAcceptedAdmins = updatedMembers.filter(
            (m) => m.role === "admin" && m.invitation_status === "accepted"
          ).length;
          const totalAcceptedMembers =
            currentMembers?.filter((m) => m.invitation_status === "accepted")
              .length || 0;

          if (remainingAcceptedAdmins === 0 && totalAcceptedMembers > 1) {
            console.warn(
              `Attempted to remove last admin ${currentMember.invitation_email || currentMember.user_id} from workspace ${workspaceId}`
            );
            return c.json(
              {
                success: false,
                error:
                  "Cannot remove the last accepted admin from a workspace with multiple accepted members.",
              },
              400
            );
          }
        }

        if (
          currentMember.user_id === userId &&
          currentMember.invitation_status === "accepted"
        ) {
          const totalAcceptedMembers =
            currentMembers?.filter((m) => m.invitation_status === "accepted")
              .length || 0;
          if (totalAcceptedMembers > 1) {
            console.warn(
              `Attempted to remove current user ${userId} from workspace ${workspaceId} via member deletion.`
            );
            return c.json(
              {
                success: false,
                error:
                  "Cannot remove your own membership from a workspace with other accepted members. Use the 'Leave Workspace' option.",
              },
              400
            );
          }
        }

        memberDeletes.push(currentMember.id);
      }
    }
  }

  try {
    const { error: workspaceUpdateError } = await supabase
      .from("workspaces")
      .update({
        name: name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId);

    if (workspaceUpdateError) {
      console.error("Error updating workspace details:", workspaceUpdateError);
      throw new Error(
        `Failed to update workspace details: ${workspaceUpdateError.message}`
      );
    }

    if (memberUpdates.length > 0) {
      const { error: updateMembersError } = await supabase
        .from("workspace_members")
        .upsert(memberUpdates, { onConflict: "id" });

      if (updateMembersError) {
        console.error("Error updating workspace members:", updateMembersError);
        throw new Error(
          `Failed to update workspace members: ${updateMembersError.message}`
        );
      }
    }

    if (memberInserts.length > 0) {
      const { error: insertMembersError } = await supabase
        .from("workspace_members")
        .insert(memberInserts);

      if (insertMembersError) {
        console.error(
          "Error inserting new workspace members:",
          insertMembersError
        );
        throw new Error(
          `Failed to invite new workspace members: ${insertMembersError.message}`
        );
      }

      console.log(
        `Invited ${memberInserts.length} new members to workspace ${workspaceId}`
      );
    }

    if (memberDeletes.length > 0) {
      const { error: deleteMembersError } = await supabase
        .from("workspace_members")
        .delete()
        .in("id", memberDeletes)
        .eq("workspace_id", workspaceId);

      if (deleteMembersError) {
        console.error("Error deleting workspace members:", deleteMembersError);
        throw new Error(
          `Failed to remove workspace members: ${deleteMembersError.message}`
        );
      }
    }

    const { data: updatedWorkspace, error: fetchUpdatedError } = await supabase
      .from("workspaces")
      .select(
        `
        *,
        workspace_members (
          id,
          user_id,
          role,
          invitation_email,
          invitation_status
        )
      `
      )
      .eq("id", workspaceId)
      .eq("workspace_members.user_id", userId)
      .single();

    if (fetchUpdatedError) {
      console.error("Error re-fetching updated workspace:", fetchUpdatedError);
      return c.json(
        {
          success: true,
          error: "Workspace updated, but failed to fetch latest data.",
          details: fetchUpdatedError.message,
        },
        200
      );
    }

    const { count: monitorCount, error: countError } = await supabase
      .from("monitors")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    if (countError) {
      console.error(
        `Error counting monitors for workspace ${workspaceId} after update:`,
        countError
      );
    }

    return c.json({
      data: { ...updatedWorkspace, monitorCount: monitorCount || 0 },
      success: true,
    });
  } catch (error: unknown) {
    console.error(`Unexpected error updating workspace ${workspaceId}:`, error);
    return c.json(
      {
        success: false,
        error: "An unexpected error occurred during workspace update.",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}
