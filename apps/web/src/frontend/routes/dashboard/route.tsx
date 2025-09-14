import { DashboardSidebar } from "@/frontend/components/dashboard-sidebar";
import NotFoundPage from "@/frontend/components/not-found-page";
import {
  SidebarInset,
  SidebarProvider,
} from "@/frontend/components/ui/sidebar";
import { checkOnboardingStatus } from "@/frontend/features/profiles/utils/onboarding";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  notFoundComponent: NotFoundPage,
  loader: async ({ location }) => {
    // Don't load data if we're on specific pages to avoid redirect loops
    if (
      location.pathname === "/dashboard/onboarding" ||
      location.pathname === "/dashboard/workspaces/new"
    ) {
      return { workspaces: [] };
    }

    try {
      const workspaces = await queryClient.ensureQueryData({
        queryKey: ["workspaces"],
        queryFn: fetchWorkspaces,
      });

      const onboardingStatus = checkOnboardingStatus(workspaces, false);

      if (onboardingStatus.needsOnboarding) {
        throw redirect({
          to: "/dashboard/onboarding",
        });
      }

      // If user has completed onboarding and has workspaces, redirect to first workspace
      if (workspaces.length > 0 && location.pathname === "/dashboard") {
        throw redirect({
          to: "/dashboard/$workspaceSlug/monitors",
          params: { workspaceSlug: workspaces[0].slug },
        });
      }

      // If user has completed onboarding but has no workspaces, they can stay on dashboard index
      return { workspaces };
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      return { workspaces: [] };
    }
  },
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) {
      return;
    }

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth/log-in",
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
