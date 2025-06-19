import { Link, redirect, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Route } from "../routes/dashboard/route";
import { Button } from "./ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { WorkspaceDropdown } from "./workspace-dropdown";

export function AppSidebar() {
  const { workspaceName } = useParams({ strict: false });
  const workspaces = Route.useLoaderData();

  const currentWorkspace =
    workspaces.find((w) => w.name === workspaceName) ?? workspaces[0];

  const navItems = useMemo(
    () => [
      {
        to: "/dashboard/$workspaceName/monitors",
        label: "Monitors",
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
        to: "/dashboard/workspaces",
        label: "Workspaces",
        disabled: !currentWorkspace,
      },
    ],
    [currentWorkspace],
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="p-3">
          <SidebarMenuItem>
            {currentWorkspace ? (
              <Link
                to="/dashboard/$workspaceName/monitors"
                params={{ workspaceName: currentWorkspace.name }}
                className="font-mono font-semibold text-2xl"
              >
                Shamva
              </Link>
            ) : (
              <span className="font-semibold text-2xl font-mono">Shamva</span>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-3">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild disabled={item.disabled}>
                {currentWorkspace ? (
                  <Link
                    to={item.to}
                    params={{ workspaceName: currentWorkspace.name }}
                    className="font-mono text-sm"
                    activeProps={{ "data-active": "true" }}
                    disabled={item.disabled}
                  >
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span className="font-mono text-sm opacity-50">
                    {item.label}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <WorkspaceDropdown />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center gap-2">
                <Button
                  variant={"outline"}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    redirect({
                      to: "/",
                      throw: true,
                    });
                  }}
                >
                  Sign out
                </Button>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
