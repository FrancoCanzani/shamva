import { useWorkspace } from "@/frontend/lib/context/workspace-context";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
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
  const { selectedWorkspace, isLoading: workspacesLoading } = useWorkspace();

  const navItems = useMemo(
    () => [
      {
        to: selectedWorkspace
          ? "/dashboard/" + selectedWorkspace.name + "/monitors"
          : undefined,
        label: "Monitors",
        disabled: workspacesLoading || !selectedWorkspace,
      },
      {
        to: selectedWorkspace
          ? "/dashboard/" + selectedWorkspace.name + "/logs"
          : undefined,
        label: "Logs",
        disabled: workspacesLoading || !selectedWorkspace,
      },
      {
        to: selectedWorkspace
          ? "/dashboard/" + selectedWorkspace.name + "/status"
          : undefined,
        label: "Status Pages",
        disabled: workspacesLoading || !selectedWorkspace,
      },
      {
        to: "/dashboard/workspaces",
        label: "Workspaces",
        disabled: workspacesLoading || !selectedWorkspace,
      },
    ],
    [selectedWorkspace, workspacesLoading],
  );

  const blinksLogoLink = useMemo(() => {
    if (workspacesLoading || !selectedWorkspace) {
      return undefined;
    }
    return "/dashboard/" + selectedWorkspace.name + "/monitors";
  }, [selectedWorkspace, workspacesLoading]);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="p-3">
          <SidebarMenuItem>
            {selectedWorkspace ? (
              <Link
                to={blinksLogoLink}
                className="font-mono"
                disabled={workspacesLoading || !selectedWorkspace}
              >
                <span className="font-semibold font-mono">Blinks</span>
                {workspacesLoading && "..."}
              </Link>
            ) : (
              <span className="font-semibold font-mono">
                Blinks{workspacesLoading && "..."}
              </span>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-3">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild disabled={item.disabled}>
                {selectedWorkspace ? (
                  <Link
                    to={item.to}
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
                <span className="text-sm font-medium font-mono">John Doe</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
