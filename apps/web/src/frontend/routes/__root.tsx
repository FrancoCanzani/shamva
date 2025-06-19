import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import NotFoundPage from "../components/pages/not-found-page";
import { SidebarProvider } from "../components/ui/sidebar";
import { AuthProvider } from "../lib/context/auth-context";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,

  component: () => (
    <>
      <AuthProvider>
        <SidebarProvider>
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <Toaster />
          </QueryClientProvider>
        </SidebarProvider>
      </AuthProvider>
    </>
  ),
});
