import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import WorkspaceDropdown from "../features/workspaces/components/workspace-dropdown";
import { useWorkspaces } from "../hooks/use-workspaces";
import { Workspace } from "../lib/types";
import { cn } from "../lib/utils";
import { Route } from "../routes/dashboard/route";
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
  const { workspaceSlug } = useParams({ strict: false });
  const loaderData = Route.useLoaderData();
  const router = useRouterState();
  const { workspaces, currentWorkspace } = useWorkspaces(workspaceSlug);

  // Use workspaces from hook if available, fallback to loader data
  const allWorkspaces =
    workspaces?.length > 0 ? workspaces : loaderData?.workspaces || [];

  // Use current workspace from hook, or find by slug, or use first available
  const effectiveCurrentWorkspace =
    currentWorkspace ||
    (workspaceSlug
      ? allWorkspaces?.find((w: Workspace) => w.slug === workspaceSlug)
      : null) ||
    allWorkspaces?.[0];

  // If we have a workspace, use its slug for navigation
  const effectiveWorkspaceSlug = effectiveCurrentWorkspace?.slug;

  // Only show nav items if we have a workspace
  const navItems = effectiveWorkspaceSlug
    ? [
        {
          to: "/dashboard/$workspaceSlug/monitors",
          label: "Monitors",
          params: { workspaceSlug: effectiveWorkspaceSlug },
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              className="fill-black dark:fill-white"
            >
              <path d="M80-600v-120q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v120h-80v-120H160v120H80Zm80 440q-33 0-56.5-23.5T80-240v-120h80v120h640v-120h80v120q0 33-23.5 56.5T800-160H160Zm240-120q11 0 21-5.5t15-16.5l124-248 44 88q5 11 15 16.5t21 5.5h240v-80H665l-69-138q-5-11-15-15.5t-21-4.5q-11 0-21 4.5T524-658L400-410l-44-88q-5-11-15-16.5t-21-5.5H80v80h215l69 138q5 11 15 16.5t21 5.5Zm80-200Z" />
            </svg>
          ),
        },
        {
          to: "/dashboard/$workspaceSlug/heartbeats",
          label: "Heartbeats",
          params: { workspaceSlug: effectiveWorkspaceSlug },
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              className="fill-black dark:fill-white"
            >
              <path d="M480-480Zm0 360q-18 0-34.5-6.5T416-146L148-415q-35-35-51.5-80T80-589q0-103 67-177t167-74q48 0 90.5 19t75.5 53q32-34 74.5-53t90.5-19q100 0 167.5 74T880-590q0 49-17 94t-51 80L543-146q-13 13-29 19.5t-34 6.5Z" />
            </svg>
          ),
        },
        {
          to: "/dashboard/$workspaceSlug/collectors",
          label: "Collectors",
          params: { workspaceSlug: effectiveWorkspaceSlug },
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              className="fill-black dark:fill-white"
            >
              <path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z" />
            </svg>
          ),
        },
        {
          to: "/dashboard/$workspaceSlug/logs",
          label: "Logs",
          params: { workspaceSlug: effectiveWorkspaceSlug },
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              className="fill-black dark:fill-white"
            >
              <path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z" />
            </svg>
          ),
        },
        {
          to: "/dashboard/$workspaceSlug/status-pages",
          label: "Status Pages",
          params: { workspaceSlug: effectiveWorkspaceSlug },
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              className="fill-black dark:fill-white"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-440H200v440Z" />
            </svg>
          ),
        },
        {
          to: "/dashboard/$workspaceSlug/notifications",
          label: "Notifications",
          params: { workspaceSlug: effectiveWorkspaceSlug },
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              className="fill-black dark:fill-white"
            >
              <path d="M120-80q-33 0-56.5-23.5T40-160v-520h80v520h600v80H120Zm440-334L280-578v258h560v-258L560-414ZM280-240q-33 0-56.5-23.5T200-320v-340q0-21 9.5-40t28.5-30l322-190 80 47-352 207 272 160 270-160q15-9 30.5-8.5T890-666q14 8 22 21.5t8 30.5v294q0 33-23.5 56.5T840-240H280Zm280-320L448-672l56-56 56 56 142-142 56 56-198 198Zm0 240h280-560 280Z" />
            </svg>
          ),
        },
      ]
    : [];

  return (
    <Sidebar>
      <SidebarHeader className="mb-2 flex h-12 flex-row items-center justify-start border-b border-dashed p-0 font-mono">
        <WorkspaceDropdown />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  {effectiveCurrentWorkspace ? (
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.to}
                        params={{
                          workspaceSlug: effectiveCurrentWorkspace.slug,
                        }}
                        preload="intent"
                        className={cn(
                          "hover:border-border dark:hover:bg-input/30 rounded-md border border-transparent py-4 opacity-65 hover:bg-stone-50 hover:opacity-100",
                          router.location.pathname.includes(
                            item.to.split("/").pop()!
                          ) &&
                            "dark:bg-input/30 border-border border-1 bg-white opacity-100 ring-1 ring-inset"
                        )}
                      >
                        {item.icon}
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
