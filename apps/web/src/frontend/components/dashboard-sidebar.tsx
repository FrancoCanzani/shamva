import { Link, useParams } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  FileText,
  Globe,
  Heart,
  LogOut,
  Settings,
} from "lucide-react";
import { useMemo } from "react";
import { WorkspaceDropdown } from "../features/workspaces/components/workspace-dropdown";
import { supabase } from "../lib/supabase";
import { Route } from "../routes/dashboard/route";
import { Workspace } from "../types/types";
import { Button } from "./ui/button";
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

export function DashboardSidebar() {
  const { workspaceName } = useParams({ strict: false });
  const workspaces = Route.useLoaderData();

  const currentWorkspace =
    workspaces.find((w: Workspace) => w.name === workspaceName) ??
    workspaces[0];

  const navItems = useMemo(
    () => [
      {
        to: "/dashboard/$workspaceName/monitors",
        label: "Monitors",
        icon: Activity,
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/heartbeats",
        label: "Heartbeats",
        icon: Heart,
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/logs",
        label: "Logs",
        icon: FileText,
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/status-pages",
        label: "Status Pages",
        icon: Globe,
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/$workspaceName/notifications",
        label: "Notifications",
        icon: Bell,
        disabled: !currentWorkspace,
      },
      {
        to: "/dashboard/workspaces",
        label: "Workspaces",
        icon: Settings,
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
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.label}>
                    {currentWorkspace && !item.disabled ? (
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.to}
                          params={{ workspaceName: currentWorkspace.name }}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton disabled>
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <WorkspaceDropdown />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
