import fetchHeartbeat from "@/frontend/features/heartbeats/api/heartbeat";
import EditHeartbeatPage from "@/frontend/features/heartbeats/components/edit-heartbeat-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/heartbeats/$id/edit/"
)({
  loader: ({ params, context }) => fetchHeartbeat({ params, context }),
  staleTime: 30_000,
  component: EditHeartbeatPage,
});
