import type { Session, User } from "@supabase/supabase-js";
import z from "zod";
import {
  CollectorSchema,
  MemberInviteSchema,
  StatusPageSchema,
  WorkspaceSchema,
} from "./schemas";

export type WorkspaceFormValues = z.infer<typeof WorkspaceSchema>;
export type MemberInvite = z.infer<typeof MemberInviteSchema>;

export interface WorkspaceFormMember {
  id?: string;
  email: string;
  role: "admin" | "member";
  invitation_status?: "pending" | "accepted" | "declined";
  user_id?: string | null;
}

export type StatusPageFormValues = z.infer<typeof StatusPageSchema>;
export type CollectorFormValues = z.infer<typeof CollectorSchema>;

export interface WorkspaceMember {
  id: string;
  user_id: string | null;
  role: "admin" | "member";
  invitation_email: string | null;
  invitation_status: "pending" | "accepted" | "declined";
}

export interface Workspace extends WorkspaceFormValues {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  workspace_members?: WorkspaceMember[];
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
}

export interface Monitor {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  check_type: "http" | "tcp";
  url: string | null;
  tcp_host_port: string | null;
  method: "GET" | "POST" | "HEAD" | null;
  headers: Record<string, string>;
  last_check_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  body: Record<string, unknown> | string | null;
  region: string;
  interval: number;
  status: "broken" | "active" | "maintenance" | "paused" | "degraded" | "error";
  error_message: string | null;
  name: string;
  regions: string[];
  degraded_threshold_ms: number;
  timeout_threshold_ms: number;
  recent_logs: Partial<Log>[];
}

export interface Log {
  id: string;
  workspace_id: string;
  monitor_id: string | null;
  heartbeat_id?: string | null;
  url: string;
  status_code: number;
  region: string;
  latency: number;
  created_at: string;
  headers: Record<string, string> | null;
  body_content: BodyContent | null;
  error: string | null;
  method: string;
  check_type: "http" | "tcp" | "heartbeat";
  tcp_host?: string;
  tcp_port?: number;
  ok: boolean;
}

export interface BodyContent {
  raw: string | null;
  truncated: boolean;
  parsed?: Record<string, unknown> | null;
  contentType?: string | null;
  parseError?: string | null;
}

export type ApiLogResponse = {
  Logs: Log[];
};

export interface CreateMonitorRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface MonitorFormData {
  name: string;
  checkType: "http" | "tcp";
  url?: string;
  method?: "GET" | "POST" | "HEAD";
  tcpHostPort?: string;
  interval: number;
  regions: string[];
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
  slackWebhookUrl?: string;
  heartbeatId?: string;
  heartbeatTimeoutSeconds?: number;
  enableHeartbeat?: boolean;
  degradedThresholdMs?: number;
  timeoutThresholdMs?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error: string | null;
  details?: string;
}

export interface StatusPage {
  id: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  slug: string;
  title: string;
  description: string | null;
  show_values: boolean;
  password: string | null;
  is_public: boolean;
  monitors: string[];
}

export interface DailyStat {
  date: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  uptime_percentage: number | null;
}

export interface PublicMonitor {
  id: string;
  name: string;
  url: string;
  status: "active" | "error" | "degraded" | "maintenance" | "broken";
  uptime_percentage?: number;
  avg_response_time?: number;
  total_checks?: number;
  successful_checks?: number;
  daily_stats?: DailyStat[];
}

export interface PublicStatusPageData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  show_values: boolean;
  monitors: PublicMonitor[];
  needsPassword?: boolean;
  requiresPassword?: boolean;
}

export interface PasswordRequiredResponse {
  requiresPassword: true;
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
  regions_affected: string[];
  error_message: string | null;
  created_at: string;
  updated_at: string;
  monitors?: Partial<Monitor>;
}

export interface Heartbeat {
  id: string;
  workspace_id: string;
  ping_id: string;
  name: string;
  expected_lapse_ms: number;
  grace_period_ms: number;
  status: "idle" | "active" | "paused" | "timeout";
  last_beat_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Collector {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  token: string;
  is_active: boolean;
}

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};
