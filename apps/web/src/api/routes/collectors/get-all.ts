import { Context } from "hono";
import { supabase } from "../../lib/supabase/client";

export default async function getAllCollectors(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.query("workspaceId");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!workspaceId) {
    return c.json({ success: false, error: "Workspace ID is required" }, 400);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Workspace not found" }, 404);
  }

  try {
    const { data: collectors, error: collectorsError } = await supabase
      .from("collectors")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (collectorsError) {
      console.error("Error fetching collectors:", collectorsError);
      return c.json(
        {
          success: false,
          error: "Failed to fetch collectors",
          details: collectorsError.message,
        },
        500
      );
    }

    const collectorsWithMetrics = await Promise.all(
      collectors.map(async (collector) => {
        const { data: lastMetric } = await supabase
          .from("metrics")
          .select("*")
          .eq("collector_id", collector.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...collector,
          last_metric: lastMetric || undefined,
        };
      })
    );

    return c.json({
      data: collectorsWithMetrics,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching collectors:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch collectors",
        details: String(error),
      },
      500
    );
  }
}
