import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "../components/error-boundary";
import NotFoundPage from "../components/not-found-page";
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
