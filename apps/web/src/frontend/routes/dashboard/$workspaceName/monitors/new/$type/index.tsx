import { createFileRoute } from "@tanstack/react-router";
import NewMonitorPage from "@/frontend/components/pages/new-monitor-page";

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/new/$type/")({
  component: NewMonitorPage,
}); 