import type { User } from "@supabase/supabase-js";
import z from "zod";
import { MonitorsParamsSchema } from "./schemas";

export type MonitorsParams = z.infer<typeof MonitorsParamsSchema>;

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
  status: "broken" | "active" | "maintenance" | "paused" | "warning" | "error";
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
  colo: string | null;
  method: string;
}
