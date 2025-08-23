import { AuthContextType } from "@/frontend/lib/types";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "../components/error-boundary";
import NotFoundPage from "../components/not-found-page";
import { Providers } from "../components/providers";

export interface RouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  notFoundComponent: NotFoundPage,

  component: () => (
    <ErrorBoundary>
      <Providers>
        <Outlet />
      </Providers>
    </ErrorBoundary>
  ),
});
