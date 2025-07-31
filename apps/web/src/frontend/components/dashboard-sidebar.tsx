import { Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { WorkspaceDropdown } from "../features/workspaces/components/workspace-dropdown";
import { Route } from "../routes/dashboard/route";
import { Workspace } from "../types/types";
import { Button } from "./ui/button";
import { useRouteContext } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { ThemeToggle } from "./ui/theme-toggle";
import { FeedbackForm } from "./feedback-form";

export function DashboardSidebar() {
  const { workspaceName } = useParams({ strict: false });
  const workspaces = Route.useLoaderData();
  const { auth } = useRouteContext({ from: "/dashboard" });

  const currentWorkspace =
    workspaces.find((w: Workspace) => w.name === workspaceName) ??
    workspaces[0];

  const navItems = useMemo(
    () => [
      {
        to: "/dashboard/$workspaceName/monitors",
        label: "Monitors",
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/heartbeats",
        label: "Heartbeats",
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/logs",
        label: "Logs",
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/status-pages",
        label: "Status Pages",
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/notifications",
        label: "Notifications",
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/workspaces",
        label: "Workspaces",
        disabled: !currentWorkspace,
      },
    ],
    [currentWorkspace]
  );

  return (
    <Sidebar className="border-none">
      <SidebarHeader>
        <h1 className="text-xl font-medium">Shamva</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  {currentWorkspace && !item.disabled ? (
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.to}
                        params={{ workspaceName: currentWorkspace.name }}
                        preload="intent"
                      >
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <WorkspaceDropdown />
            <ThemeToggle />
            <FeedbackForm />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                await auth.signOut();
                window.location.href = "/";
              }}
            >
              Sign out
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
