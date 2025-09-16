import { AuthContextType } from "@/frontend/lib/types";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { ErrorBoundary } from "../components/error-boundary";
import NotFoundPage from "../components/not-found-page";
import { Providers } from "../components/providers";

export interface RouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        name: "description",
        content: "My App is a web application",
      },
      {
        title: "My App",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,

  component: () => (
    <>
      <HeadContent />
      <ErrorBoundary>
        <Providers>
          <Outlet />
        </Providers>
      </ErrorBoundary>
      <Scripts />
    </>
  ),
});
