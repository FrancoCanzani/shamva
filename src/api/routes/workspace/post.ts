import { Context } from "hono";
import { WorkspaceSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function postWorkspace(c: Context) {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { success: false, error: "Invalid JSON payload provided." },
      400,
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
      400,
    );
  }

  const { workspaceName, description, members } = result.data;
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
  }

  const supabase = createSupabaseClient(c.env);

  try {
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName,
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
        500,
      );
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: "admin",
        invitation_status: "accepted", // Creator is automatically accepted
      });

    if (memberError) {
      console.error("Error adding creator as admin:", memberError);
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      return c.json(
        {
          success: false,
          error: "Failed to add creator to workspace",
          details: memberError.message,
        },
        500,
      );
    }

    const memberPromises = members.map(async (member) => {
      const { data: existingUser } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", member.email)
        .single();

      return supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: existingUser?.id || null,
        role: member.role,
        invitation_email: member.email,
        invitation_status: existingUser ? "pending" : "pending", // If user exists, set to pending
        invited_by: userId,
      });
    });

    await Promise.all(memberPromises).catch((err) => {
      console.error("Error processing member invitations:", err);
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
          invitation_status
        )
      `,
      )
      .eq("id", workspace.id)
      .single();

    if (finalError) {
      console.error("Error fetching final workspace data:", finalError);
    }

    return c.json({
      data: workspaceWithMembers || workspace,
      success: true,
    });
  } catch (error) {
    console.error("Unexpected error creating workspace:", error);
    return c.json(
      {
        success: false,
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
}
