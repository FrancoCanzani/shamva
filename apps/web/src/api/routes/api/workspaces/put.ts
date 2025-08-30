import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import {
  UUIDParamSchema,
  WorkspaceUpdateBodySchema,
  WorkspaceWithMembersSchema,
} from "./schemas";

const route = createRoute({
  method: "put",
  path: "/workspaces/:id",
  request: {
    params: UUIDParamSchema,
    body: {
      content: { "application/json": { schema: WorkspaceUpdateBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Updated",
      content: {
        "application/json": {
          schema: z.object({
            data: WorkspaceWithMembersSchema.extend({
              monitorCount: z.number().optional(),
            }),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPutWorkspaces(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { id: workspaceId } = c.req.valid("param");
    const {
      slug,
      name,
      description,
      members: updatedMembers,
    } = c.req.valid("json");
    try {
      const { data: userMembership, error: userMembershipError } =
        await supabase
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
        throw new HTTPException(403, { message: "Insufficient permissions" });
      }

      const { data: currentMembers, error: currentMembersError } =
        await supabase
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
            updatedMembers.some(
              (m) => m.email === currentMember.invitation_email
            );

          if (!isStillInUpdatedListByEmail) {
            if (
              currentMember.role === "admin" &&
              currentMember.invitation_status === "accepted"
            ) {
              const remainingAcceptedAdmins = updatedMembers.filter(
                (m) => m.role === "admin" && m.invitation_status === "accepted"
              ).length;
              const totalAcceptedMembers =
                currentMembers?.filter(
                  (m) => m.invitation_status === "accepted"
                ).length || 0;

              if (remainingAcceptedAdmins === 0 && totalAcceptedMembers > 1) {
                throw new HTTPException(400, {
                  message: "Cannot remove the last accepted admin",
                });
              }
            }

            if (
              currentMember.user_id === userId &&
              currentMember.invitation_status === "accepted"
            ) {
              const totalAcceptedMembers =
                currentMembers?.filter(
                  (m) => m.invitation_status === "accepted"
                ).length || 0;
              if (totalAcceptedMembers > 1) {
                throw new HTTPException(400, {
                  message: "Cannot remove your own accepted membership",
                });
              }
            }

            memberDeletes.push(currentMember.id);
          }
        }
      }

      try {
        const { data: existingWorkspace, error: checkError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("slug", slug)
          .neq("id", workspaceId)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw new HTTPException(500, {
            message: "Failed to check workspace slug availability",
          });
        }

        if (existingWorkspace) {
          throw new HTTPException(409, {
            message: "Workspace slug is already in use",
          });
        }

        const { error: workspaceUpdateError } = await supabase
          .from("workspaces")
          .update({
            slug: slug,
            name: name,
            description: description || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);

        if (workspaceUpdateError) {
          throw new HTTPException(500, {
            message: "Failed to update workspace",
          });
        }

        if (memberUpdates.length > 0) {
          const { error: updateMembersError } = await supabase
            .from("workspace_members")
            .upsert(memberUpdates, { onConflict: "id" });

          if (updateMembersError) {
            throw new HTTPException(500, {
              message: "Failed to update members",
            });
          }
        }

        if (memberInserts.length > 0) {
          const { error: insertMembersError } = await supabase
            .from("workspace_members")
            .insert(memberInserts);

          if (insertMembersError) {
            throw new HTTPException(500, {
              message: "Failed to invite members",
            });
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
            throw new HTTPException(500, {
              message: "Failed to remove members",
            });
          }
        }

        const { data: updatedWorkspace, error: fetchUpdatedError } =
          await supabase
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
          throw new HTTPException(500, {
            message: "Updated but failed to fetch latest data",
          });
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
          error: null,
        });
      } catch (e) {
        throw new HTTPException(500, { message: "Failed to update workspace" });
      }
    } catch {
      throw new HTTPException(500, { message: "Failed to update workspace" });
    }
  });
}
