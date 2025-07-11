import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { subDays } from "date-fns";
import MonitorHeader from "../monitor/monitor-header";
import MonitorIncidentsSection from "../monitor/monitor-incidents-section";
import MonitorRecentChecks from "../monitor/monitor-recent-checks";
import MonitorRegionLatencyCharts from "../monitor/monitor-region-latency-charts";
import MonitorStats from "../monitor/monitor-stats";

export default function MonitorPage() {
  const monitor = Route.useLoaderData();
  const { days } = Route.useSearch();

  const filterDate = subDays(new Date(), days);
  const filteredLogs = (monitor.recent_logs || []).filter((log) => {
    if (!log.created_at) return false;
    const logDate = new Date(log.created_at);
    return logDate >= filterDate;
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4">
      <MonitorHeader />
      <MonitorStats logs={filteredLogs} />
      <MonitorIncidentsSection incidents={monitor.incidents || []} />
      <MonitorRegionLatencyCharts logs={filteredLogs} height={36} />
      <MonitorRecentChecks logs={monitor.recent_logs} />
    </div>
  );
}
