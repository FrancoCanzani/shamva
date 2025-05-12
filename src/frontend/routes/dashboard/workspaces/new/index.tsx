import NewWorkspacePage from "@/frontend/components/pages/new-workspace-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/workspaces/new/")({
  component: NewWorkspacePage,
});
