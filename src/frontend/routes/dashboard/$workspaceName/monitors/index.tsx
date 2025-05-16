import { MonitorsTable } from "@/frontend/components/monitors/monitors-table";
import { fetchMonitors } from "@/frontend/lib/loaders/monitors";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/")({
  loader: ({ params, abortController }) =>
    fetchMonitors({ params, abortController }),
  component: MonitorsPage,
});

function MonitorsPage() {
  const monitorsData = Route.useLoaderData();

  return <MonitorsTable monitors={monitorsData} />;
}
