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
}

export type ApiLogResponse = {
  Logs: Log[];
};
