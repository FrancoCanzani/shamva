import { AuthContextType } from "@/frontend/lib/types";
import {
  createRootRouteWithContext,
  Outlet,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ErrorBoundary } from "../components/error-boundary";
import NotFoundPage from "../components/not-found-page";
import { Providers } from "../components/providers";

export interface RouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  notFoundComponent: NotFoundPage,

  head: () => ({
    title: "Shamva - Monitoring & Observability Platform",
    meta: [
      {
        name: "description",
        content:
          "Shamva is a modern monitoring and observability platform that helps you track, monitor, and alert on your applications and infrastructure.",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      },
      {
        property: "og:title",
        content: "Shamva - Monitoring & Observability Platform",
      },
      {
        property: "og:description",
        content:
          "Shamva is a modern monitoring and observability platform that helps you track, monitor, and alert on your applications and infrastructure.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Shamva - Monitoring & Observability Platform",
      },
      {
        name: "twitter:description",
        content:
          "Shamva is a modern monitoring and observability platform that helps you track, monitor, and alert on your applications and infrastructure.",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/src/frontend/assets/favicon.ico",
      },
    ],
  }),

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
