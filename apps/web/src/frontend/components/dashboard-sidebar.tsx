import { Link, useParams } from "@tanstack/react-router";
import {
  Activity,
  Heart,
  FileText,
  Globe,
  Settings,
  LogOut,
} from "lucide-react";
import { useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Route } from "../routes/dashboard/route";
import { Button } from "./ui/button";
import { WorkspaceDropdown } from "./workspace-dropdown";
import { ThemeToggle } from "./ui/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

export function DashboardSidebar() {
  const { workspaceName } = useParams({ strict: false });
  const workspaces = Route.useLoaderData();

  const currentWorkspace =
    workspaces.find((w) => w.name === workspaceName) ?? workspaces[0];

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
        to: "/dashboard/workspaces",
        label: "Workspaces",
        icon: Settings,
        disabled: !currentWorkspace,
      },
    ],
    [currentWorkspace]
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          to="/dashboard/$workspaceName/monitors"
          params={{ workspaceName: currentWorkspace?.name }}
          className="text-xl font-bold tracking-wide uppercase"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Shamva
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
