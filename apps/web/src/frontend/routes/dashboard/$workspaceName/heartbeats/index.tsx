import { createFileRoute } from "@tanstack/react-router";
import { fetchHeartbeats } from "@/frontend/lib/loaders/heartbeats";
import HeartbeatsPage from "@/frontend/components/pages/heartbeats-page";

export const Route = createFileRoute("/dashboard/$workspaceName/heartbeats/")({
  loader: ({ params, abortController }) =>
    fetchHeartbeats({ params, abortController }),
  staleTime: 30_000,
  component: HeartbeatsPage,
});
