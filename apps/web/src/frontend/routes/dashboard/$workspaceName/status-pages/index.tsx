import Loading from "@/frontend/components/loading";
import fetchStatusPages from "@/frontend/features/status-pages/api/status-page";
import StatusPagesPage from "@/frontend/features/status-pages/components/status-pages-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/status-pages/")(
  {
    loader: ({ params, abortController }) =>
      fetchStatusPages({ params, abortController }),
    component: StatusPagesPage,
    pendingComponent: Loading,
  }
);
