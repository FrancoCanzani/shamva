import { Context } from "hono";
import { CollectorsCreateSchema } from "../../lib/schemas";
import { supabase } from "../../lib/supabase/client";
import { CollectorsCreateParams } from "../../lib/types";

export default async function postCollectors(c: Context) {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { data: null, success: false, error: "Invalid JSON payload provided." },
      400
    );
  }

  const result = CollectorsCreateSchema.safeParse(rawBody);

  if (!result.success) {
    console.error("Validation Error Details:", result.error.issues);
    return c.json(
      {
        data: null,
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.issues,
      },
      400
    );
  }

  const { name, workspaceId, token }: CollectorsCreateParams = result.data;
  const userId = c.get("userId");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated." },
      401
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return c.json(
      {
        data: null,
        success: false,
        error:
          "You do not have permission to create collectors in this workspace.",
      },
      403
    );
  }

  if (membership.role === "viewer") {
    return c.json(
      {
        data: null,
        success: false,
        error:
          "Viewers cannot create collectors. Contact a workspace admin or member.",
      },
      403
    );
  }

  try {
    const { data, error: insertError } = await supabase
      .from("collectors")
      .insert([
        {
          name: name,
          token: token,
          workspace_id: workspaceId,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase collector insert error:", insertError);
      throw new Error(
        `Failed to create collector record: ${insertError.message}`
      );
    }

    if (!data) {
      throw new Error("Failed to create collector record: No data returned.");
    }

    return c.json({
      data: data,
      success: true,
    });
  } catch (error) {
    console.error("Error during collector database creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to create collector in database.",
        details: String(error),
      },
      500
    );
  }
}
