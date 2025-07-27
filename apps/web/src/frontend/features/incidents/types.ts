import { Incident } from "@/frontend/types/types";

export interface IncidentUpdateData {
  content: string;
  author_name: string;
  author_email: string;
}

export interface IncidentUpdate {
  id: string;
  content: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

export interface IncidentUpdateWithAuthor {
  id: string;
  author: string;
  author_name?: string;
  author_email?: string;
  content: string;
  created_at: string;
  author_id?: string;
}

export interface IncidentWithUpdates extends Incident {
  updates?: IncidentUpdateWithAuthor[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  description?: string;
  color?: string;
}
