import Loading from "@/frontend/components/loading";
import { fetchMonitors } from "@/frontend/features/monitors/api/monitors";
import MonitorsPage from "@/frontend/features/monitors/components/monitors-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceSlug/monitors/")({
  loader: ({ params, context }) => fetchMonitors({ params, context }),
  staleTime: 30_000,
  component: MonitorsPage,
  pendingComponent: Loading,
});
