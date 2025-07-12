import { DashboardSidebar } from "@/frontend/components/dashboard-sidebar";
import NotFoundPage from "@/frontend/components/pages/not-found-page";
import {
  SidebarInset,
  SidebarProvider,
} from "@/frontend/components/ui/sidebar";
import { useAuth } from "@/frontend/lib/context/auth-context";
import fetchWorkspaces from "@/frontend/lib/loaders/workspaces";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  notFoundComponent: NotFoundPage,
  loader: fetchWorkspaces,
});

function DashboardLayout() {
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) throw redirect({ to: "/auth/login" });

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="overflow-auto">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
