import { AuthContextType } from "@/frontend/types/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ErrorBoundary } from "../components/error-boundary";
import NotFoundPage from "../components/not-found-page";
import { Providers } from "../components/providers";

export interface RouterContext {
  auth: AuthContextType;
  queryClient: QueryClient;
  supabase: SupabaseClient;
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
