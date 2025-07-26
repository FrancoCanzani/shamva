import { createFileRoute } from "@tanstack/react-router";
import NewMonitorPage from "@/frontend/features/monitors/components/new-monitor-page";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/monitors/new/$type/"
)({
  component: NewMonitorPage,
});
