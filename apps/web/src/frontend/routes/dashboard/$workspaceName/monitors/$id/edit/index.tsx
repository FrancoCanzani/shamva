import EditMonitorPage from "@/frontend/components/pages/edit-monitor-page";
import fetchMonitor from "@/frontend/lib/loaders/monitor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/monitors/$id/edit/"
)({
  component: EditMonitorPage,
  loader: ({ params, abortController }) =>
    fetchMonitor({ params, abortController }),
});
