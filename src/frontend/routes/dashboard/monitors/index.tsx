import { MonitorsList } from "@/frontend/components/monitors/monitors-list";
import { fetchMonitors } from "@/frontend/lib/loaders/monitors";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/monitors/")({
  loader: ({ abortController }) => fetchMonitors({ abortController }),
  component: MonitorsComponent,
});

function MonitorsComponent() {
  const monitorsData = Route.useLoaderData();

  console.log(monitorsData);
  return <MonitorsList monitors={monitorsData} />;
}
