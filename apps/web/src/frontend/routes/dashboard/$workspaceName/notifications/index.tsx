import Loading from "@/frontend/components/loading";
import { fetchNotifications } from "@/frontend/features/notifications/api/notifications";
import NotificationsPage from "@/frontend/features/notifications/components/notifications-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/notifications/"
)({
  loader: ({ params, context }) => fetchNotifications({ params, context }),
  staleTime: 30_000,
  component: NotificationsPage,
  pendingComponent: Loading,
});
