import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { WorkspaceDropwdown } from "./workspace-dropdown";

export function AppSidebar() {
  const navItems = [
    {
      href: "/dashboard/monitors",
      label: "Monitors",
    },
    {
      href: "/dashboard/campaigns",
      label: "Campaigns",
    },
    {
      href: "/dashboard/logs",
      label: "Logs",
    },
    {
      href: "/dashboard/users",
      label: "Team",
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="p-3">
          <SidebarMenuItem>
            <Link to="/dashboard/monitors" className="font-mono">
              <span className="font-semibold font-mono">Blinks</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.href}
                  className="font-mono text-sm"
                  activeProps={{ "data-active": "true" }}
                >
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <WorkspaceDropwdown />
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
