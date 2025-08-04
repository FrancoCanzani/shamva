import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { Context } from "hono";
import { z } from "zod";
import { createSupabaseClient } from "../../lib/supabase/client";

const AiCheckSchema = z.object({
  incidentId: z.string(),
});

export default async function postAiCheck(c: Context) {
  const userId = c.get("userId");
  const incidentId = c.req.param("id");

  if (!userId) {
    return c.json({ success: false, error: "User not authenticated" }, 401);
  }

  if (!incidentId) {
    return c.json({ success: false, error: "Incident ID is required" }, 400);
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

  const result = AiCheckSchema.safeParse(rawBody);
  if (!result.success) {
    return c.json(
      {
        success: false,
        error: "Validation failed",
        details: result.error.flatten(),
      },
      400
    );
  }

  const supabase = createSupabaseClient(c.env);

  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .select(
      `
      *,
      monitors (
        id,
        name,
        url,
        method,
        check_type,
        error_message,
        status,
        regions,
        workspace_id
      )
    `
    )
    .eq("id", incidentId)
    .single();

  if (incidentError || !incident) {
    return c.json({ success: false, error: "Incident not found" }, 404);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", incident.monitors.workspace_id)
    .eq("user_id", userId)
    .eq("invitation_status", "accepted")
    .single();

  if (membershipError || !membership) {
    return c.json({ success: false, error: "Insufficient permissions" }, 403);
  }

  const { data: logs } = await supabase
    .from("logs")
    .select("*")
    .eq("monitor_id", incident.monitor_id)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: updates } = await supabase
    .from("incident_updates")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  const analysisData = {
    incident: {
      id: incident.id,
      started_at: incident.started_at,
      resolved_at: incident.resolved_at,
      acknowledged_at: incident.acknowledged_at,
      regions_affected: incident.regions_affected,
      screenshot_url: incident.screenshot_url,
      error_message: incident.monitors?.error_message,
    },
    monitor: {
      name: incident.monitors?.name,
      url: incident.monitors?.url,
      method: incident.monitors?.method,
      check_type: incident.monitors?.check_type,
      status: incident.monitors?.status,
      regions: incident.monitors?.regions,
    },
    logs: logs || [],
    updates: updates || [],
  };

  const prompt = `You are an expert DevOps engineer analyzing a monitoring incident.

INCIDENT DATA:
${JSON.stringify(analysisData, null, 2)}

Analyze this incident and provide a structured response with:
- rootCause: A concise explanation of the root cause (max 50 words)
- solutions: An array of 2-3 specific, actionable steps to resolve the issue (max 30 words each)
- prevention: An array of 2-3 measures to prevent similar incidents (max 30 words each)
- confidence: A number between 1-10 indicating your confidence in this analysis
- summary: A brief summary of the key findings (max 25 words)

Keep all responses extremely concise and actionable. Use bullet points and short sentences. Respond with the actual values, not a schema description.`;

  try {
    const { object: aiAnalysis } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        rootCause: z.string(),
        solutions: z.array(z.string()),
        prevention: z.array(z.string()),
        confidence: z.number().min(1).max(10),
        summary: z.string(),
      }),
      prompt,
    });

    const { error: updateError } = await supabase
      .from("incidents")
      .update({ ai_analysis: aiAnalysis })
      .eq("id", incidentId);

    if (updateError) {
      return c.json(
        {
          success: false,
          error: "Failed to save AI analysis",
          details: updateError.message,
        },
        500
      );
    }

    return c.json({
      success: true,
      data: aiAnalysis,
    });
  } catch (error) {
    console.error("AI check error:", error);

    if (error && typeof error === "object" && "text" in error) {
      console.error("AI Response text:", error.text);
    }

    return c.json(
      {
        success: false,
        error: "Failed to generate AI analysis",
        details:
          "The AI model was unable to generate a valid analysis. Please try again.",
      },
      500
    );
  }
}
