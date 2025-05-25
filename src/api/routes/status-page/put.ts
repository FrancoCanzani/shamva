import { Context } from "hono";
import { StatusPageSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function putStatusPage(c: Context) {
  const userId = c.get("userId");
  const statusPageId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!statusPageId) {
    return c.json({ success: false, error: "Status page ID is required" }, 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { success: false, error: "Invalid JSON payload provided." },
      400,
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
      400,
    );
  }

  const { slug, title, description, showValues, password, isPublic, monitors } =
    result.data;

  const supabase = createSupabaseClient(c.env);

  const { data: existingStatusPage, error: fetchError } = await supabase
    .from("status_pages")
    .select("*")
    .eq("id", statusPageId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ success: false, error: "Status page not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error fetching status page",
        details: fetchError.message,
      },
      500,
    );
  }

  if (!existingStatusPage) {
    return c.json({ success: false, error: "Status page not found" }, 404);
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", existingStatusPage.workspace_id)
    .eq("user_id", userId)
    .single();

  if (!membership || membership.role === "viewer") {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  if (slug !== existingStatusPage.slug) {
    const { data: conflictingStatusPage } = await supabase
      .from("status_pages")
      .select("id")
      .eq("workspace_id", existingStatusPage.workspace_id)
      .eq("slug", slug)
      .neq("id", statusPageId)
      .single();

    if (conflictingStatusPage) {
      return c.json(
        {
          success: false,
          error:
            "A status page with this slug already exists in this workspace.",
        },
        400,
      );
    }
  }

  try {
    const updateData = {
      slug,
      title,
      description: description || null,
      show_values: showValues,
      password: password || null,
      is_public: isPublic,
      monitors,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedStatusPage, error: updateError } = await supabase
      .from("status_pages")
      .update(updateData)
      .eq("id", statusPageId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating status page:", updateError);
      return c.json(
        {
          success: false,
          error: "Failed to update status page",
          details: updateError.message,
        },
        500,
      );
    }

    return c.json({
      data: updatedStatusPage,
      success: true,
    });
  } catch (err) {
    console.error(`Error updating status page ${statusPageId}:`, err);
    const errorDetails = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        success: false,
        error: "Failed to update status page",
        details: errorDetails,
      },
      500,
    );
  }
}
