import fetchWorkspace from "@/frontend/features/workspaces/api/workspace";
import EditWorkspacePage from "@/frontend/features/workspaces/components/edit-workspace-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId/")({
  loader: ({ params, context }) =>
    fetchWorkspace({ params, context }),
  component: EditWorkspacePage,
});
