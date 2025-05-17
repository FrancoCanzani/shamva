import MonitorsPage from "@/frontend/components/pages/monitors-page";
import { fetchMonitors } from "@/frontend/lib/loaders/monitors";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/")({
  loader: ({ params, abortController }) =>
    fetchMonitors({ params, abortController }),
  component: MonitorsPage,
});
