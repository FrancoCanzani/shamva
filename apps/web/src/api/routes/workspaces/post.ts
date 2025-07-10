import { Context } from "hono";
import { WorkspaceSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function postWorkspaces(c: Context) {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
    console.log("Received workspace creation request:", rawBody);
  } catch {
    return c.json(
      { data: null, success: false, error: "Invalid JSON payload provided." },
      400
    );
  }

  const result = WorkspaceSchema.safeParse(rawBody);

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

  const { name, description, members, creatorEmail } = result.data;

  const userId = c.get("userId");

  const supabase = createSupabaseClient(c.env);
  try {
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: name,
        description: description || null,
        created_by: userId,
      })
      .select()
      .single();

    if (workspaceError) {
      console.error("Error creating workspace:", workspaceError);
      return c.json(
        {
          success: false,
          error: "Failed to create workspace",
          details: workspaceError.message,
        },
        500
      );
    }

    console.log("Workspace created successfully:", workspace);

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
      console.error("Error adding admin member:", memberError);
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      return c.json(
        {
          success: false,
          error: "Failed to add creator to workspace",
          details: memberError.message,
        },
        500
      );
    }

    console.log(
      "Admin member added successfully, proceeding with invitations for:",
      members
    );

    const memberPromises = members.map((member) =>
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

    try {
      const results = await Promise.all(memberPromises);
      console.log("Member invitation results:", results);

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

      if (finalError) throw finalError;

      console.log("Final workspace state:", workspaceWithMembers);

      return c.json({
        data: workspaceWithMembers || workspace,
        success: true,
      });
    } catch (err) {
      console.error("Error adding members:", err);
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      throw err;
    }
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to create workspace",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}
