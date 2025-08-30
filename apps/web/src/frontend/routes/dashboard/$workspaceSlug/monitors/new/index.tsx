import NewMonitorPage from "@/frontend/features/monitors/components/new-monitor-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceSlug/monitors/new/")(
  {
    component: NewMonitorPage,
  }
);
