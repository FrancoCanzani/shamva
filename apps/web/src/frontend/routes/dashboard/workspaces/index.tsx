import Loading from "@/frontend/components/loading";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspace";
import WorkspacesPage from "@/frontend/features/workspaces/components/workspaces-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/workspaces/")({
  loader: fetchWorkspaces,
  component: WorkspacesPage,
  pendingComponent: Loading,
});
