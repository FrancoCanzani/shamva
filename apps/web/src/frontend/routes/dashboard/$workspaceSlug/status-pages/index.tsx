import Loading from "@/frontend/components/loading";
import { fetchStatusPages } from "@/frontend/features/status-pages/api/status-pages";
import StatusPagesPage from "@/frontend/features/status-pages/components/status-pages-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceSlug/status-pages/")(
  {
    loader: ({ params, context }) => fetchStatusPages({ params, context }),
    component: StatusPagesPage,
    pendingComponent: Loading,
  }
);
