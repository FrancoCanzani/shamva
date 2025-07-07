import { createFileRoute } from "@tanstack/react-router";
import fetchHeartbeat from "@/frontend/lib/loaders/heartbeat";
import EditHeartbeatPage from "@/frontend/components/pages/edit-heartbeat-page";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/heartbeats/$id/edit/"
)({
  loader: ({ params, abortController }) =>
    fetchHeartbeat({ params, abortController }),
  staleTime: 30_000,
  component: EditHeartbeatPage,
});
