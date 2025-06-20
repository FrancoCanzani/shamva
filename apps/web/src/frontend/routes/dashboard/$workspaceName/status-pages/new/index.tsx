import NewStatusPage from "@/frontend/components/pages/new-status-page-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/status-pages/new/"
)({
  component: NewStatusPage,
});
