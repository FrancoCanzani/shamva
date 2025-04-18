import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import { AuthProvider } from "../lib/context/auth-context";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <Toaster />
          <TanStackRouterDevtools />
        </QueryClientProvider>
      </AuthProvider>
    </>
  ),
});
