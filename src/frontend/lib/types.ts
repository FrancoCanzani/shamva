export interface Monitor {
  id: string;
  created_at: string;
  updated_at: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  last_check_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  failure_count: number;
  success_count: number;
  user_id: string;
  is_active: boolean;
  body: string | Record<string, unknown> | null;
  do_id: string;
  interval: number;
  status: "active" | "warning" | "error" | "initializing" | "broken";
  error_message: string | null;
}

export interface Log {
  id: string;
  user_id: string;
  monitor_id: string;
  do_id: string;
  url: string;
  status: number;
  ok: boolean;
  latency: number;
  created_at: string;
  headers: Record<string, string> | null;
  body_content: string | Record<string, unknown> | null;
  error: string | null;
  colo: string | null;
  method: string;
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

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error: string | null;
  details?: string;
}
