import { Context } from "hono";
import { StatusPageSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function postStatusPages(c: Context) {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { success: false, error: "Invalid JSON payload provided." },
      400
    );
  }

  const result = StatusPageSchema.safeParse(rawBody);

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
    slug,
    title,
    description,
    showValues,
    password,
    isPublic,
    monitors,
    workspaceId,
  } = result.data;

  const userId = c.get("userId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated." }, 401);
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
          "You do not have permission to create status pages in this workspace.",
      },
      403
    );
  }

  if (membership.role === "viewer") {
    return c.json(
      {
        success: false,
        error:
          "Viewers cannot create status pages. Contact a workspace admin or member.",
      },
      403
    );
  }

  const { data: existingStatusPage } = await supabase
    .from("status_pages")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("slug", slug)
    .single();

  if (existingStatusPage) {
    return c.json(
      {
        success: false,
        error: "A status page with this slug already exists in this workspace.",
      },
      400
    );
  }

  try {
    const { data, error: insertError } = await supabase
      .from("status_pages")
      .insert([
        {
          slug,
          title,
          description: description || null,
          show_values: showValues,
          password: password || null,
          is_public: isPublic,
          monitors,
          workspace_id: workspaceId,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase status page insert error:", insertError);
      throw new Error(`Failed to create status page: ${insertError.message}`);
    }

    if (!data) {
      throw new Error("Failed to create status page: No data returned.");
    }

    console.log(`Status page created. ID: ${data.id}`);

    return c.json({
      data,
      success: true,
    });
  } catch (error) {
    console.error("Error during status page creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to create status page.",
        details: String(error),
      },
      500
    );
  }
}
