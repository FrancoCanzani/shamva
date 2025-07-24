import fetchMonitor from "@/frontend/features/monitors/api/monitor";
import EditMonitorPage from "@/frontend/features/monitors/components/edit-monitor-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/monitors/$id/edit/"
)({
  component: EditMonitorPage,
  loader: ({ params, abortController }) =>
    fetchMonitor({ params, abortController }),
});
