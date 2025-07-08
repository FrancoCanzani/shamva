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
  intervalMs?: number;
  method: string;
  region: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | null;
}

export type Region =
  | "wnam"
  | "enam"
  | "sam"
  | "weur"
  | "eeur"
  | "apac"
  | "oc"
  | "afr"
  | "me";

export interface Monitor {
  id: string;
  workspace_id: string;
  check_type: "http" | "tcp";
  url: string | null;
  tcp_host_port: string | null;
  method: "GET" | "POST" | "HEAD" | null;
  interval: number;
  regions: Region[];
  headers: Record<string, string> | null;
  body: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_check_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  status: "broken" | "active" | "maintenance" | "paused" | "error" | "degraded";
  error_message: string | null;
  name: string;
  slack_webhook_url: string | null;
  recent_logs: Partial<Log>[];
  incidents: Partial<Incident>[];
}

export interface Heartbeat {
  id: string;
  workspace_id: string;
  name: string;
  expected_lapse_ms: number;
  grace_period_ms: number;
  status: "active" | "paused" | "deleted";
  last_beat_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  monitor_id: string;
  url: string;
  status_code: number;
  region: string;
  latency: number;
  created_at: string;
  headers: Record<string, string> | null;
  body_content: string | Record<string, unknown> | null;
  error: string | null;
  method: string;
  check_type: "http" | "tcp";
  tcp_host?: string;
  tcp_port?: number;
  ok: boolean;
}

export interface BodyContent {
  rawContent: string;
  parseError?: string;
}

export interface MonitorConfig {
  checkType: "http" | "tcp";
  urlToCheck: string;
  tcpHostPort?: string;
  monitorId: string;
  workspaceId: string;
  method?: string;
  intervalMs: number;
  region: string;
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
