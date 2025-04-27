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
}

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
