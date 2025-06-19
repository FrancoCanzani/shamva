import Loading from "@/frontend/components/loading";
import WorkspacesPage from "@/frontend/components/pages/workspaces-page";
import fetchWorkspaces from "@/frontend/lib/loaders/workspaces";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/workspaces/")({
  loader: fetchWorkspaces,
  component: WorkspacesPage,
  pendingComponent: Loading,
});
