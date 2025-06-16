import type { User } from "@supabase/supabase-js";
import z from "zod";
import { MonitorsParamsSchema, WorkspaceSchema } from "./schemas";

export type MonitorsParams = z.infer<typeof MonitorsParamsSchema>;

export type Workspace = z.infer<typeof WorkspaceSchema>;

export interface WorkspaceMember {
  id: string;
  user_id: string | null;
  role: "admin" | "member" | "viewer";
  invitation_email: string | null;
  invitation_status: "pending" | "accepted" | "declined";
}

export type ApiVariables = {
  user: User;
  userId: string;
};

export interface InitializeCheckerDOPayload {
  urlToCheck: string;
  monitorId: string;
  userId: string;
  intervalMs?: number;
  method: string;
  region: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | null;
}

export interface Monitor {
  id: string;
  created_at: string;
  updated_at: string;
  url: string;
  method: "GET" | "POST" | "HEAD";
  headers: Record<string, string>;
  last_check_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  failure_count: number;
  success_count: number;
  user_id: string;
  body: Record<string, unknown> | string | null;
  region: string;
  interval: number;
  status: "broken" | "active" | "maintenance" | "paused" | "error" | "degraded";
  error_message: string | null;
  name: string;
  regions: string[];
  recent_logs: Partial<Log>[];
}

export interface Log {
  id: string;
  user_id: string;
  monitor_id: string;
  do_id: string;
  url: string;
  status_code: number;
  region: string;
  latency: number;
  created_at: string;
  headers: Record<string, string> | null;
  body_content: string | Record<string, unknown> | null;
  error: string | null;
  method: string;
}

export interface BodyContent {
  rawContent: string;
  parseError?: string;
}

export interface MonitorConfig {
  urlToCheck: string;
  monitorId: string;
  userId: string;
  workspaceId: string;
  method: string;
  intervalMs: number;
  region: string | null;
  createdAt: number;
  consecutiveFailures: number;
  lastStatusCode?: number;
  headers?: Record<string, string>;
  body?: string | FormData | URLSearchParams;
}

export interface CheckResult {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  headers: Record<string, string> | null;
  bodyContent: string | object | null;
  checkError: string | null;
  colo: string | null;
}

export interface MonitorEmailData {
  monitorId: string;
  monitorName: string;
  url: string;
  statusCode?: number;
  errorMessage?: string;
  lastChecked: string;
  region: string;
}

export interface Incident {
  id: string;
  monitor_id: string;
  workspace_id: string;
  started_at: string;
  notified_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  screenshot_url: string | null;
  post_mortem: string | null;
  downtime_duration_ms: number | null;
  regions_affected: string[];
  created_at: string;
  updated_at: string;
}
