import { fetchHeartbeats } from "@/frontend/features/heartbeats/api/heartbeats";
import HeartbeatsPage from "@/frontend/features/heartbeats/components/heartbeats-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/heartbeats/")({
  loader: ({ params, abortController }) =>
    fetchHeartbeats({ params, abortController }),
  staleTime: 30_000,
  component: HeartbeatsPage,
});
