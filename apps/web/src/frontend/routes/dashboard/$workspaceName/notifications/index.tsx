import Loading from "@/frontend/components/loading";
import NotificationsPage from "@/frontend/features/notifications/components/notifications-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/notifications/"
)({
  component: NotificationsPage,
  pendingComponent: Loading,
});
