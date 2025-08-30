import { createFileRoute } from "@tanstack/react-router";
import NewMonitorPage from "@/frontend/features/monitors/components/new-monitor-page";

export const Route = createFileRoute(
  "/dashboard/$workspaceSlug/monitors/new/$type/"
)({
  component: NewMonitorPage,
});
