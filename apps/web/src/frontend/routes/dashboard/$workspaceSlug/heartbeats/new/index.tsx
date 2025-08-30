import NewHeartbeatPage from "@/frontend/features/heartbeats/components/new-heartbeat-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceSlug/heartbeats/new/"
)({
  component: NewHeartbeatPage,
});
