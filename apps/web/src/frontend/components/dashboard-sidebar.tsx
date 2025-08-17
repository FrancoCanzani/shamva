import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { WorkspaceDropdown } from "../features/workspaces/components/workspace-dropdown";
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
  const { workspaceName } = useParams({ strict: false });
  const workspaces = Route.useLoaderData();
  const router = useRouterState();

  const currentWorkspace =
    workspaces.find((w: Workspace) => w.name === workspaceName) ??
    workspaces[0];

  const navItems = [
    {
      to: "/dashboard/$workspaceName/monitors",
      label: "Monitors",
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
      to: "/dashboard/$workspaceName/heartbeats",
      label: "Heartbeats",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          className="fill-black dark:fill-white"
        >
          <path d="M480-480Zm0 360q-18 0-34.5-6.5T416-146L148-415q-35-35-51.5-80T80-589q0-103 67-177t167-74q48 0 90.5 19t75.5 53q32-34 74.5-53t90.5-19q100 0 167.5 74T880-590q0 49-17 94t-51 80L543-146q-13 13-29 19.5t-34 6.5Zm40-520q10 0 19 5t14 13l68 102h166q7-17 10.5-34.5T801-590q-2-69-46-118.5T645-758q-31 0-59.5 12T536-711l-27 29q-5 6-13 9.5t-16 3.5q-8 0-16-3.5t-14-9.5l-27-29q-21-23-49-36t-60-13q-66 0-110 50.5T160-590q0 18 3 35.5t10 34.5h187q10 0 19 5t14 13l35 52 54-162q4-12 14.5-20t23.5-8Zm12 130-54 162q-4 12-15 20t-24 8q-10 0-19-5t-14-13l-68-102H236l237 237q2 2 3.5 2.5t3.5.5q2 0 3.5-.5t3.5-2.5l236-237H600q-10 0-19-5t-15-13l-34-52Z" />
        </svg>
      ),
    },
    {
      to: "/dashboard/$workspaceName/logs",
      label: "Logs",
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
      to: "/dashboard/$workspaceName/status-pages",
      label: "Status Pages",
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
      to: "/dashboard/$workspaceName/notifications",
      label: "Notifications",
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
    {
      to: "/dashboard/workspaces",
      label: "Workspaces",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          className="fill-black dark:fill-white"
        >
          <path d="M40-160v-160q0-34 23.5-57t56.5-23h131q20 0 38 10t29 27q29 39 71.5 61t90.5 22q49 0 91.5-22t70.5-61q13-17 30.5-27t36.5-10h131q34 0 57 23t23 57v160H640v-91q-35 25-75.5 38T480-200q-43 0-84-13.5T320-252v92H40Zm440-160q-38 0-72-17.5T351-386q-17-25-42.5-39.5T253-440q22-37 93-58.5T480-520q63 0 134 21.5t93 58.5q-29 0-55 14.5T609-386q-22 32-56 49t-73 17ZM160-440q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T280-560q0 50-34.5 85T160-440Zm640 0q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T920-560q0 50-34.5 85T800-440ZM480-560q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-680q0 50-34.5 85T480-560Z" />
        </svg>
      ),
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="mb-2 flex h-12 flex-row items-center justify-start border-b border-dashed font-mono">
        <h1 className="pl-1 text-xl font-medium tracking-wide">Shamva</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  {currentWorkspace ? (
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.to}
                        params={{ workspaceName: currentWorkspace.name }}
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
