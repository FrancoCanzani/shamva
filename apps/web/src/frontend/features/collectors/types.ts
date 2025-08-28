import { Collector } from "@/frontend/lib/types";

export interface Metric {
  id: string;
  collector_id: string;
  workspace_id: string;
  timestamp: string;
  hostname: string;
  platform: string;
  cpu_percent: number;
  load_avg_1: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  disk_free_gb: number;
  disk_total_gb: number;
  network_sent_mb: number;
  network_recv_mb: number;
  network_sent_mbps: number;
  network_recv_mbps: number;
  network_connected: boolean;
  network_interface: string;
  top_process_name: string;
  top_process_cpu: number;
  total_processes: number;
  temperature_celsius: number;
  power_status: string;
  battery_percent: number;
  uptime_seconds: number;
  created_at: string;
}

export interface CollectorWithLastMetrics extends Collector {
  last_metric: Metric;
}

export interface CollectorWithMetrics extends Collector {
  metrics?: Metric[];
}
