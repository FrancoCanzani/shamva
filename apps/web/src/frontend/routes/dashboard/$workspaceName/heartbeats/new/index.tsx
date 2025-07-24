import NewHeartbeatPage from "@/frontend/features/heartbeats/components/new-heartbeat-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/heartbeats/new/"
)({
  component: NewHeartbeatPage,
});
