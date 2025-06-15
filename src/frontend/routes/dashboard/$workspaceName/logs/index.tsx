import Loading from "@/frontend/components/loading";
import { LogsDataTable } from "@/frontend/components/logs/logs-data-table";
import { fetchLogs } from "@/frontend/lib/loaders/logs";
import { createFileRoute } from "@tanstack/react-router";

type LogsSearch = {
  logId?: string;
};

export const Route = createFileRoute("/dashboard/$workspaceName/logs/")({
  validateSearch: (search: Record<string, unknown>): LogsSearch => {
    return {
      logId: typeof search?.logId === "string" ? search.logId : undefined,
    };
  },
  loader: ({ abortController, params }) =>
    fetchLogs({ abortController, params }),
  component: RouteComponent,
  pendingComponent: Loading,
});

function RouteComponent() {
  const logsData = Route.useLoaderData();

  return <LogsDataTable data={logsData} />;
}
