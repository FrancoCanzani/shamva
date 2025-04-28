import { Context } from "hono";
import { nanoid } from "nanoid";
import { MonitorsParamsSchema } from "../../lib/schemas";
import { createSupabaseClient } from "../../lib/supabase/client";
import { MonitorsParams } from "../../lib/types";

export default async function postMonitors(c: Context) {
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        error: "Invalid JSON payload provided.",
      },
      400,
    );
  }

  const result = MonitorsParamsSchema.safeParse(rawBody);

  if (!result.success) {
    console.error("Validation Error Details:", result.error.flatten());
    console.log(result.error.flatten());
    return c.json(
      {
        success: false,
        error: "Request parameter validation failed.",
        details: result.error.flatten(),
      },
      400,
    );
  }

  const { url, method, headers, body }: MonitorsParams = result.data;
  const userId = c.get("userId");
  const doName = `${userId}-${nanoid(10)}`;
  const doId = c.env.CHECKER_DURABLE_OBJECT.idFromName(doName);

  let monitorData = null;

  try {
    const supabase = createSupabaseClient(c.env);
    const { data, error: insertError } = await supabase
      .from("monitors")
      .insert([
        {
          url: url,
          method: method,
          headers: headers ?? {},
          body: body,
          user_id: userId,
          do_id: doId.toString(),
          interval: result.data.interval ?? 60000,
          status: "initializing",
          is_active: true,
          failure_count: 0,
          success_count: 0,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw new Error(
        `Failed to create monitor record in database: ${insertError.message}`,
      );
    }

    if (!data) {
      throw new Error(
        "Failed to create monitor record: No data returned from database.",
      );
    }

    monitorData = data;
    console.log(
      `Monitor created in database. ID: ${monitorData.id}, DO ID: ${doId.toString()}`,
    );
  } catch (error) {
    console.error("Error during monitor database creation:", error);
    return c.json(
      {
        data: null,
        success: false,
        error: "Failed to create monitor in database",
        details: String(error),
      },
      500,
    );
  }

  let doInitialized = false;
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000;

  while (!doInitialized && retryCount < maxRetries) {
    try {
      const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId);
      const initPayload = {
        urlToCheck: monitorData.url,
        monitorId: monitorData.id,
        userId: userId,
        intervalMs: monitorData.interval ?? 60000,
        method: method,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await doStub.fetch(
        new Request(new URL("/initialize", new URL(c.req.url).origin), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initPayload),
          signal: controller.signal,
        }),
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DO returned status ${response.status}: ${errorText}`);
      }

      const supabase = createSupabaseClient(c.env);
      await supabase
        .from("monitors")
        .update({ status: "active" })
        .eq("id", monitorData.id);

      doInitialized = true;
      console.log(
        `Durable Object initialized successfully for monitor ID: ${monitorData.id}`,
      );
    } catch (error: unknown) {
      retryCount++;
      console.error(`DO initialization attempt ${retryCount} failed:`, error);

      if (retryCount < maxRetries) {
        console.log(`Retrying DO initialization in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  if (!doInitialized) {
    try {
      const supabase = createSupabaseClient(c.env);
      await supabase
        .from("monitors")
        .update({
          status: "error",
          error_message: "Failed to initialize checker after multiple attempts",
        })
        .eq("id", monitorData.id);

      return c.json(
        {
          data: monitorData,
          success: false,
          error: "Failed to initialize checker after multiple attempts",
          details: `Monitor record created (ID: ${monitorData?.id}), but failed to start the background checker.`,
        },
        500,
      );
    } catch (dbError) {
      console.error(
        "Failed to update monitor status after DO init failure:",
        dbError,
      );
      return c.json(
        {
          data: monitorData,
          success: false,
          error:
            "Critical error: Monitor created but checker failed to initialize",
          details: `Monitor record created (ID: ${monitorData?.id}), but failed to start the background checker and failed to update monitor status.`,
        },
        500,
      );
    }
  }

  try {
    const doStub = c.env.CHECKER_DURABLE_OBJECT.get(doId);
    const verifyResponse = await doStub.fetch(
      new Request(new URL("/verify", new URL(c.req.url).origin), {
        method: "GET",
      }),
    );

    if (!verifyResponse.ok) {
      console.warn(
        `DO verification check failed for monitor ${monitorData.id}, but proceeding anyway`,
      );
    }
  } catch (verifyError) {
    console.warn(
      `DO verification check failed for monitor ${monitorData.id}:`,
      verifyError,
    );
  }

  return c.json({
    data: monitorData,
    success: true,
  });
}
