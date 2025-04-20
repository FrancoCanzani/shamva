import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import NotFoundPage from "../components/pages/not-found-page";
import { AuthProvider } from "../lib/context/auth-context";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,

  component: () => (
    <>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster />
          <TanStackRouterDevtools position="bottom-right" />
        </QueryClientProvider>
      </AuthProvider>
    </>
  ),
});
