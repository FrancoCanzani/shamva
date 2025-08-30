import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { EnvBindings } from "../../../../../bindings";
import type { ApiVariables } from "../../../lib/types";
import { supabase } from "../../../lib/supabase/client";
import { HTTPException } from "hono/http-exception";
import { openApiErrorResponses } from "../../../lib/utils";
import {
  WorkspaceCreateBodySchema,
  WorkspaceWithMembersSchema,
} from "./schemas";

const route = createRoute({
  method: "post",
  path: "/workspaces",
  request: {
    body: {
      content: { "application/json": { schema: WorkspaceCreateBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Created",
      content: {
        "application/json": {
          schema: z.object({
            data: z.union([
              z.array(WorkspaceWithMembersSchema),
              WorkspaceWithMembersSchema,
            ]),
            success: z.literal(true),
            error: z.null(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export default function registerPostWorkspaces(
  api: OpenAPIHono<{ Bindings: EnvBindings; Variables: ApiVariables }>
) {
  return api.openapi(route, async (c) => {
    const userId = c.get("userId");
    const { slug, name, description, members, creatorEmail } =
      c.req.valid("json");

    const { data: existingWorkspace, error: checkError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
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

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        slug,
        name,
        description: description,
        created_by: userId,
      })
      .select()
      .single();

    if (workspaceError || !workspace) {
      throw new HTTPException(500, { message: "Failed to create workspace" });
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: "admin",
        invitation_email: creatorEmail,
        invitation_status: "accepted",
      });

    if (memberError) {
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      throw new HTTPException(500, { message: "Failed to add creator" });
    }

    const memberPromises = members.map(
      (member: { email: string; role: string }) =>
        supabase
          .from("workspace_members")
          .insert({
            workspace_id: workspace.id,
            user_id: null,
            role: member.role,
            invitation_email: member.email,
            invitation_status: "pending",
            invited_by: userId,
          })
          .select()
          .single()
    );

    await Promise.all(memberPromises).catch(async () => {
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      throw new HTTPException(500, { message: "Failed to invite members" });
    });

    const { data: workspaceWithMembers, error: finalError } = await supabase
      .from("workspaces")
      .select(
        `
          *,
          workspace_members (
            id,
            user_id,
            role,
            invitation_email,
            invitation_status,
            invited_by
          )
        `
      )
      .eq("id", workspace.id);

    if (finalError) {
      throw new HTTPException(500, { message: "Failed to load workspace" });
    }

    return c.json({
      data: workspaceWithMembers || workspace,
      success: true,
      error: null,
    });
  });
}
