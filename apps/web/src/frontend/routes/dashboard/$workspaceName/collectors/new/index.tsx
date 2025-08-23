import NewCollectorPage from "@/frontend/features/collectors/components/new-collector-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/collectors/new/"
)({
  component: NewCollectorPage,
});
