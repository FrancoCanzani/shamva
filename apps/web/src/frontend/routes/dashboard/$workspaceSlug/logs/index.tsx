import Loading from "@/frontend/components/loading";
import { createFileRoute } from "@tanstack/react-router";

export type LogsSearch = {
  logId?: string;
};

export const Route = createFileRoute("/dashboard/$workspaceSlug/logs/")({
  validateSearch: (search: Record<string, unknown>): LogsSearch => {
    return {
      logId: typeof search?.logId === "string" ? search.logId : undefined,
    };
  },
  pendingComponent: Loading,
});
