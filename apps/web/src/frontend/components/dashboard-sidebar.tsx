import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useMemo } from "react";
import { WorkspaceDropdown } from "../features/workspaces/components/workspace-dropdown";
import { Route } from "../routes/dashboard/route";
import { Workspace } from "../types/types";
import { cn } from "../utils/utils";
import { FeedbackForm } from "./feedback-form";
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
  const router = useRouterState();

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
    <Sidebar>
      <SidebarHeader>
        <h1 className="pl-2 font-mono text-xl font-medium tracking-wide">
          Shamva
        </h1>
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
                        className={cn(
                          "hover:border-border dark:hover:bg-input/30 dark:bg-background rounded-md border border-transparent py-4 hover:bg-stone-50",
                          router.location.pathname.includes(
                            item.to.split("/").pop()!
                          ) &&
                            "border-border dark:bg-input/30 rounded-md border bg-stone-50 font-medium ring-1 ring-inset"
                        )}
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
          <SidebarGroupContent className="flex flex-col space-y-1">
            <WorkspaceDropdown />
            <div className="flex items-center space-x-1">
              <FeedbackForm />
              <Link to="/dashboard/settings">
                <Button variant={"outline"} size={"sm"}>
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
