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
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex-1 flex flex-col min-h-0">
        <LogsDataTable data={logsData} />
      </div>
    </div>
  );
}
