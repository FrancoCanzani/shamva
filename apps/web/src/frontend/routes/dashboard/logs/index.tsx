import Loading from "@/frontend/components/loading";
import { fetchLogs } from "@/frontend/features/logs/api/logs";
import { LogsDataTable } from "@/frontend/features/logs/components/logs-data-table";
import { createFileRoute } from "@tanstack/react-router";

export type LogsSearch = {
  logId?: string;
};

const RouteComponent = () => {
  const logsData = Route.useLoaderData();
  return <LogsDataTable data={logsData} />;
};

export const Route = createFileRoute("/dashboard/logs/")({
  validateSearch: (search: Record<string, unknown>): LogsSearch => {
    return {
      logId: typeof search?.logId === "string" ? search.logId : undefined,
    };
  },
  loader: ({ params, context }) => fetchLogs({ params, context }),
  component: RouteComponent,
  pendingComponent: Loading,
});
