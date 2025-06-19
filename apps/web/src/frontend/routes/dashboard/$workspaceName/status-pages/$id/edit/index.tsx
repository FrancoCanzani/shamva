import EditStatusPagePage from "@/frontend/components/pages/edit-status-page-page";
import fetchStatusPage from "@/frontend/lib/loaders/status-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/status-pages/$id/edit/",
)({
  component: EditStatusPagePage,
  loader: ({ params, abortController }) =>
    fetchStatusPage({ params, abortController }),
});
