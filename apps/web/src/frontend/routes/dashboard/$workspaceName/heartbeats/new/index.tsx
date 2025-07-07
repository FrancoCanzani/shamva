import { createFileRoute } from "@tanstack/react-router";
import NewHeartbeatPage from "@/frontend/components/pages/new-heartbeat-page";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/heartbeats/new/"
)({
  component: NewHeartbeatPage,
});
