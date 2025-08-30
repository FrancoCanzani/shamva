import fetchStatusPage from "@/frontend/features/status-pages/api/status-page";
import EditStatusPagePage from "@/frontend/features/status-pages/components/edit-status-page-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceSlug/status-pages/$id/edit/"
)({
  loader: ({ params, context }) => fetchStatusPage({ params, context }),
  component: EditStatusPagePage,
});
