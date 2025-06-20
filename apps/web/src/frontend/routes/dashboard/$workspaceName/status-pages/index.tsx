import Loading from "@/frontend/components/loading";
import StatusPagesPage from "@/frontend/components/pages/status-pages-page";
import { fetchStatusPages } from "@/frontend/lib/loaders/status-pages";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/status-pages/")(
  {
    loader: ({ params, abortController }) =>
      fetchStatusPages({ params, abortController }),
    component: StatusPagesPage,
    pendingComponent: Loading,
  }
);
