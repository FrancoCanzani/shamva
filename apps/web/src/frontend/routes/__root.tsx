import { createRootRoute, Outlet } from "@tanstack/react-router";
import NotFoundPage from "../components/pages/not-found-page";
import { ErrorBoundary } from "../components/error-boundary";
import { Providers } from "../components/providers";

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,


  component: () => (
    <ErrorBoundary>
      <Providers>
        <Outlet />
      </Providers>
    </ErrorBoundary>
  ),
});
