import { Incident, Monitor } from "@/frontend/types/types";

export interface MonitorWithIncidents extends Monitor {
  incidents?: Incident[];
}

export interface MonitorWithLastIncident extends Monitor {
  last_incident?: {
    id: string;
    status: "ongoing" | "acknowledged" | "mitigated";
    created_at: string;
    resolved_at: string | null;
    acknowledged_at: string | null;
  } | null;
}

export interface TimelineEvent {
  id: string;
  type: "incident_start" | "incident_end";
  title: string;
  timestamp: string;
  duration?: number | null;
  regions?: string[];
}
