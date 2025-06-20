import NewMonitorPage from "@/frontend/components/pages/new-monitor-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/new/")(
  {
    component: NewMonitorPage,
  }
);
