import { Context } from "hono";
import { CollectorsParamsSchema } from "../../lib/schemas";
import { supabase } from "../../lib/supabase/client";

export default async function putCollectors(c: Context) {
  const userId = c.get("userId");
  const collectorId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!collectorId) {
    return c.json({ success: false, error: "Collector ID is required" }, 400);
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

  const result = CollectorsParamsSchema.safeParse(rawBody);

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.issues,
      },
      400
    );
  }

  const { name } = result.data;

  const { data: existingCollector, error: fetchError } = await supabase
    .from("collectors")
    .select("*")
    .eq("id", collectorId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return c.json({ success: false, error: "Collector not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error fetching collector",
        details: fetchError.message,
      },
      500
    );
  }

  if (!existingCollector) {
    return c.json({ success: false, error: "Collector not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", existingCollector.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Collector not found" }, 404);
  }

  if (membership.role === "viewer") {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  try {
    const updateData = {
      name,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedCollector, error: updateError } = await supabase
      .from("collectors")
      .update(updateData)
      .eq("id", collectorId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating collector:", updateError);
      return c.json(
        {
          success: false,
          error: "Failed to update collector",
          details: updateError.message,
        },
        500
      );
    }

    return c.json({
      data: updatedCollector,
      success: true,
    });
  } catch (error) {
    console.error("Error updating collector:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update collector",
        details: String(error),
      },
      500
    );
  }
}
