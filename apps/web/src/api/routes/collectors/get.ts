import { Context } from "hono";
import { supabase } from "../../lib/supabase/client";

export default async function getCollector(c: Context) {
  const userId = c.get("userId");
  const collectorId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!collectorId) {
    return c.json({ success: false, error: "Collector ID is required" }, 400);
  }

  const { data: collector, error: collectorError } = await supabase
    .from("collectors")
    .select("*")
    .eq("id", collectorId)
    .single();

  if (collectorError) {
    if (collectorError.code === "PGRST116") {
      return c.json({ success: false, error: "Collector not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error fetching collector",
        details: collectorError.message,
      },
      500
    );
  }

  if (!collector) {
    return c.json({ success: false, error: "Collector not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", collector.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Collector not found" }, 404);
  }

  try {
    const { data: lastMetric } = await supabase
      .from("metrics")
      .select("*")
      .eq("collector_id", collectorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const collectorWithMetrics = {
      ...collector,
      last_metric: lastMetric || undefined,
    };

    return c.json({
      data: collectorWithMetrics,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching collector:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch collector",
        details: String(error),
      },
      500
    );
  }
}
