import { Context } from "hono";
import { createSupabaseClient } from "../../lib/supabase/client";
import { Incident } from "../../lib/types";

export default async function getAllMonitors(c: Context) {
  const userId = c.get("userId");
  const workspaceId = c.req.query("workspaceId");

  if (!userId) {
    return c.json(
      { data: null, success: false, error: "User not authenticated" },
      401
    );
  }

  if (!workspaceId) {
    return c.json(
      { data: null, success: false, error: "Workspace Id is missing" },
      400
    );
  }

  try {
    const supabase = createSupabaseClient(c.env);

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted")
      .single();

    if (membershipError || !membership) {
      return c.json({
        data: [],
        success: true,
      });
    }

    const { data: monitors, error: monitorError } = await supabase
      .from("monitors")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (monitorError) {
      console.error("Error fetching monitors from DB:", monitorError);
      return c.json(
        {
          data: null,
          success: false,
          error: "Database error fetching monitors",
          details: monitorError.message,
        },
        500
      );
    }

    if (!monitors || monitors.length === 0) {
      return c.json({
        data: [],
        success: true,
      });
    }

    const monitorIds = monitors.map((m) => m.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const { data: recentIncidents, error: incidentError } = await supabase
      .from("incidents")
      .select("*")
      .in("monitor_id", monitorIds)
      .gte("created_at", thirtyDaysAgoISO)
      .order("created_at", { ascending: false });

    if (incidentError) {
      console.error(`Error fetching recent incidents:`, incidentError);
    }

    const incidentsByMonitorId = new Map<string, Partial<Incident>[]>();
    if (recentIncidents) {
      for (const incident of recentIncidents) {
        if (!incidentsByMonitorId.has(incident.monitor_id)) {
          incidentsByMonitorId.set(incident.monitor_id, []);
        }
        incidentsByMonitorId.get(incident.monitor_id)!.push(incident);
      }
    }

    const monitorsWithLastIncident = monitors.map((monitor) => {
      const monitorIncidents = incidentsByMonitorId.get(monitor.id) || [];
      const lastIncident = monitorIncidents.length > 0 
        ? monitorIncidents.sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )[0]
        : null;
      
      return {
        ...monitor,
        last_incident: lastIncident ? {
          id: lastIncident.id,
          status: lastIncident.resolved_at ? "mitigated" : 
                  lastIncident.acknowledged_at ? "acknowledged" : "ongoing",
          created_at: lastIncident.created_at,
          resolved_at: lastIncident.resolved_at,
          acknowledged_at: lastIncident.acknowledged_at
        } : null
      };
    });

    return c.json({
      data: monitorsWithLastIncident,
      success: true,
    });
  } catch (err) {
    console.error("Unexpected error fetching monitors:", err);
    const errorDetails = err instanceof Error ? err.message : String(err);
    return c.json(
      {
        data: null,
        success: false,
        error: "An unexpected error occurred",
        details: errorDetails,
      },
      500
    );
  }
}
