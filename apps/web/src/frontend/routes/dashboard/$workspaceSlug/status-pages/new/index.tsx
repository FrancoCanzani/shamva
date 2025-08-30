import NewStatusPage from "@/frontend/features/status-pages/components/new-status-page-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceSlug/status-pages/new/"
)({
  component: NewStatusPage,
});
