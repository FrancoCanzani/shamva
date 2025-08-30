import Loading from "@/frontend/components/loading";
import { fetchHeartbeats } from "@/frontend/features/heartbeats/api/heartbeats";
import HeartbeatsPage from "@/frontend/features/heartbeats/components/heartbeats-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceSlug/heartbeats/")({
  loader: ({ params, context }) => fetchHeartbeats({ params, context }),
  staleTime: 30_000,
  component: HeartbeatsPage,
  pendingComponent: Loading,
});
