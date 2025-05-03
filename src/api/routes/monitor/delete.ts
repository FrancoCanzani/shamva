import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";

export default async function deleteMonitor(c: Context) {
  const userId = c.get("userId");
  const monitorId = c.req.param("id");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401,
    );
  }

  if (!monitorId) {
    return c.json(
      { data: null, success: false, error: "Monitor ID is required" },
      400,
    );
  }

  const supabase = createSupabaseClient(c.env);

  const { data, error } = await supabase
    .from("monitors")
    .delete()
    .eq("id", monitorId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return c.json({ success: false, error: "Monitor not found" }, 404);
    }

    return c.json(
      {
        success: false,
        error: "Database error deleting monitor",
        details: error.message,
      },
      500,
    );
  }

  return c.json(
    {
      data: data,
      success: true,
    },
    200,
  );
}
