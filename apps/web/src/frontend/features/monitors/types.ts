import { Incident, Monitor } from "@/frontend/lib/types";

export interface MonitorWithMetrics extends Monitor {
  uptime_percentage: number;
  avg_latency: number;
  last_incident: {
    id: string;
    created_at: string;
  } | null;
}

export interface MonitorWithIncidents extends Monitor {
  incidents?: Incident[];
}

export interface TimelineEvent {
  id: string;
  type: "incident_start" | "incident_end";
  title: string;
  timestamp: string;
  duration?: number | null;
  regions?: string[];
}
