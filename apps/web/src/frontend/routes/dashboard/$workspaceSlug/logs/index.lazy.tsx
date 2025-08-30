import { LogsInfiniteTable } from "@/frontend/features/logs/components/logs-infinite-table";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/dashboard/$workspaceSlug/logs/")({
  component: LogsInfiniteTable,
});
