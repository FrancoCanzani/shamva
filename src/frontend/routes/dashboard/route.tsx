import { AppSidebar } from "@/frontend/components/app-sidebar";
import NotFoundPage from "@/frontend/components/pages/not-found-page";
import { SidebarProvider } from "@/frontend/components/ui/sidebar";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  notFoundComponent: NotFoundPage,
  loader: () => {},
});

function DashboardLayout() {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) redirect({ to: "/auth/login", throw: true });

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
