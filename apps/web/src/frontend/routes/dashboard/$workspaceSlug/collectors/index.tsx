import Loading from "@/frontend/components/loading";
import { fetchCollectors } from "@/frontend/features/collectors/api/collectors";
import CollectorsPage from "@/frontend/features/collectors/components/collectors-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceSlug/collectors/")({
  loader: ({ params, context }) => fetchCollectors({ params, context }),
  staleTime: 30_000,
  component: CollectorsPage,
  pendingComponent: Loading,
});
