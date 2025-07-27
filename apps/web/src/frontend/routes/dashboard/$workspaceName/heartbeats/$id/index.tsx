import Loading from "@/frontend/components/loading";
import fetchHeartbeat from "@/frontend/features/heartbeats/api/heartbeat";
import HeartbeatPage from "@/frontend/features/heartbeats/components/heartbeat-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/heartbeats/$id/"
)({
  loader: ({ params, context }) => fetchHeartbeat({ params, context }),
  staleTime: 30_000,
  component: HeartbeatPage,
  pendingComponent: Loading,
});
