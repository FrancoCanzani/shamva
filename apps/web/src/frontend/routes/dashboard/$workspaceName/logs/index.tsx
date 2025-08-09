import Loading from "@/frontend/components/loading";
import { LogsInfiniteTable } from "@/frontend/features/logs/components/logs-infinite-table";
import { createFileRoute } from "@tanstack/react-router";

export type LogsSearch = {
  logId?: string;
};

export const Route = createFileRoute("/dashboard/$workspaceName/logs/")({
  validateSearch: (search: Record<string, unknown>): LogsSearch => {
    return {
      logId: typeof search?.logId === "string" ? search.logId : undefined,
    };
  },
  component: LogsInfiniteTable,
  pendingComponent: Loading,
});
