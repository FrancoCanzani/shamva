import { DashboardSidebar } from "@/frontend/components/dashboard-sidebar";
import NotFoundPage from "@/frontend/components/not-found-page";
import {
  SidebarInset,
  SidebarProvider,
} from "@/frontend/components/ui/sidebar";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  notFoundComponent: NotFoundPage,
  loader: async () => {
    await queryClient.ensureQueryData({
      queryKey: ["workspaces"],
      queryFn: fetchWorkspaces,
    });
    return queryClient.getQueryData(["workspaces"]) ?? [];
  },
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) {
      return;
    }

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth/login",
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
