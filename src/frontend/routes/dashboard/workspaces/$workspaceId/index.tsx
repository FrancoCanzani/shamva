import EditWorkspacePage from "@/frontend/components/pages/edit-workspace-page";
import fetchWorkspace from "@/frontend/lib/loaders/workspace";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId/")({
  loader: ({ params, abortController }) =>
    fetchWorkspace({ params, abortController }),
  component: EditWorkspacePage,
});
