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
  headers: Record<string, string>;
  body_content: Record<string, string>;
}

export type ApiLogResponse = {
  Logs: Log[];
};

export interface Monitor {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  user_id: string;
  do_id: string;
  interval_ms: number;
  created_at: string;
  updated_at: string;
  interval: number;
}

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
