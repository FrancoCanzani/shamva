import Loading from "@/frontend/components/loading";
import { fetchCollector } from "@/frontend/features/collectors/api/collector";
import CollectorPage from "@/frontend/features/collectors/components/collector-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/collectors/$id/"
)({
  component: CollectorPage,
  pendingComponent: Loading,
  loader: ({ params, context }) => fetchCollector({ params, context }),
});
