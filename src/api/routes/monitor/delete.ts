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

  try {
    const { data: checkers, error: checkersError } = await supabase
      .from("monitor_checkers")
      .select("id, region, do_id")
      .eq("monitor_id", monitorId);

    if (checkersError) {
      console.error("Error fetching monitor checkers:", checkersError);
    }

    if (checkers && checkers.length > 0) {
      for (const checker of checkers) {
        if (!checker.do_id) continue;

        try {
          const doId = c.env.CHECKER_DURABLE_OBJECT.idFromString(checker.do_id);
          const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId, {
            locationHint: checker.region,
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          await doStub.fetch("http://do.com/cleanup", {
            method: "DELETE",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          console.log(`Successfully cleaned up DO ${checker.do_id}`);
        } catch (doError) {
          console.error(`Error cleaning up DO ${checker.do_id}:`, doError);
        }
      }
    }

    const { data, error } = await supabase
      .from("monitors")
      .delete()
      .eq("id", monitorId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return c.json(
        {
          success: false,
          error: "Database error deleting monitor",
          details: error.message,
        },
        500,
      );
    }

    const { error: checkersDeleteError } = await supabase
      .from("monitor_checkers")
      .delete()
      .eq("monitor_id", monitorId);

    if (checkersDeleteError) {
      console.error("Error deleting monitor checkers:", checkersDeleteError);
    }

    return c.json(
      {
        data,
        success: true,
        message: "Monitor and associated resources deleted",
      },
      200,
    );
  } catch (unexpectedError) {
    console.error("Unexpected error deleting monitor:", unexpectedError);
    return c.json(
      {
        success: false,
        error: "Unexpected error deleting monitor",
        details: String(unexpectedError),
      },
      500,
    );
  }
}
