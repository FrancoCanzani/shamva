import fetchStatusPage from "@/frontend/features/status-pages/api/status-page";
import EditStatusPagePage from "@/frontend/features/status-pages/components/edit-status-page-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/status-pages/$id/edit/"
)({
  component: EditStatusPagePage,
  loader: ({ params, abortController }) =>
    fetchStatusPage({ params, abortController }),
});
