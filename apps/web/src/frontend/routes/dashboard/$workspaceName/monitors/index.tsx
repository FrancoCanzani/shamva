import Loading from "@/frontend/components/loading";
import MonitorsPage from "@/frontend/components/pages/monitors-page";
import { fetchMonitors } from "@/frontend/lib/loaders/monitors";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/")({
  loader: ({ params, abortController }) =>
    fetchMonitors({ params, abortController }),
  // route's data fresh for 30 seconds
  staleTime: 30_000,
  component: MonitorsPage,
  pendingComponent: Loading,
});
