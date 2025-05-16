import MonitorPage from "@/frontend/components/pages/monitor-page";
import fetchMonitor from "@/frontend/lib/loaders/monitor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/$id/")(
  {
    component: MonitorPage,
    loader: ({ params, abortController }) =>
      fetchMonitor({ params, abortController }),
  },
);
