import { DashboardSidebar } from "@/frontend/components/dashboard-sidebar";
import NotFoundPage from "@/frontend/components/not-found-page";
import {
  SidebarInset,
  SidebarProvider,
} from "@/frontend/components/ui/sidebar";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
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
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
