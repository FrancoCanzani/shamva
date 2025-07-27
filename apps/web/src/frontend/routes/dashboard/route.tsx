import { DashboardSidebar } from "@/frontend/components/dashboard-sidebar";
import NotFoundPage from "@/frontend/components/not-found-page";
import {
  SidebarInset,
  SidebarProvider,
} from "@/frontend/components/ui/sidebar";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  notFoundComponent: NotFoundPage,
  loader: fetchWorkspaces,
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) {
      return;
    }

    if (!context.auth.session) {
      throw redirect({
        to: "/",
      });
    }
  },
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
