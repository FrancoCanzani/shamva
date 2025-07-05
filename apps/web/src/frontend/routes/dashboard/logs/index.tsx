import { LogsDataTable } from "@/frontend/components/logs/logs-data-table";
import { fetchLogs } from "@/frontend/lib/loaders/logs";
import { createFileRoute } from "@tanstack/react-router";

type LogsSearch = {
  logId?: string;
};

export const Route = createFileRoute("/dashboard/logs/")({
  validateSearch: (search: Record<string, unknown>): LogsSearch => {
    return {
      logId: typeof search?.logId === "string" ? search.logId : undefined,
    };
  },
  loader: ({ abortController, params }) =>
    fetchLogs({ params, abortController }),
  component: RouteComponent,
});

function RouteComponent() {
  const logsData = Route.useLoaderData();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <LogsDataTable data={logsData} />
      </div>
    </div>
  );
}
