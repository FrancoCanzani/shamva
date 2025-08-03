import { Context } from "hono";
import { z } from "zod";
import { createSupabaseClient } from "../../lib/supabase/client";

const feedbackSchema = z.object({
  message: z.string().min(1).max(1000),
});

export default async function postFeedback(c: Context) {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      { data: null, success: false, error: "Invalid JSON payload provided." },
      400
    );
  }

  const result = feedbackSchema.safeParse(rawBody);
  if (!result.success) {
    return c.json(
      {
        data: null,
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.flatten(),
      },
      400
    );
  }

  const { message } = result.data;
  const userId = c.get("userId");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated." },
      401
    );
  }

  const supabase = createSupabaseClient(c.env);

  try {
    const { data, error: insertError } = await supabase
      .from("feedbacks")
      .insert([
        {
          user_id: userId,
          message: message,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase feedback insert error:", insertError);
      throw new Error(
        `Failed to create feedback record: ${insertError.message}`
      );
    }

    if (!data) {
      throw new Error("Failed to create feedback record: No data returned.");
    }

    return c.json({
      data: data,
      success: true,
    });
  } catch (error) {
    console.error("Error during feedback database creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to save feedback. Please try again.",
      },
      500
    );
  }
}
