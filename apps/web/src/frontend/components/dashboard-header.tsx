import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";
import { Route } from "../routes/dashboard/route";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarTrigger } from "./ui/sidebar";

interface DashboardHeaderProps {
  children?: React.ReactNode;
}

export default function DashboardHeader({ children }: DashboardHeaderProps) {
  const { workspaceName } = useParams({ strict: false });
  const workspaces = Route.useLoaderData();
  const location = useLocation();

  const pathname = location.pathname;
  const segments = pathname.split("/").filter(Boolean);

  const section = segments.find((segment) =>
    [
      "monitors",
      "heartbeats",
      "logs",
      "status-pages",
      "workspaces",
      "incidents",
    ].includes(segment)
  );

  let sectionLabel = section;
  if (section === "status-pages") {
    sectionLabel = "Status Pages";
  }

  return (
    <header className="dark:bg-background sticky top-0 z-30 flex items-center gap-4 bg-white/80 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <SidebarTrigger />

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>Dashboard</BreadcrumbItem>

          {workspaceName ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 hover:text-black hover:underline">
                    {workspaceName}
                    <ChevronDownIcon size={15} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {workspaces.map((workspace) => (
                      <DropdownMenuItem key={workspace.id} asChild>
                        <Link
                          to="/dashboard/$workspaceName/monitors"
                          params={{ workspaceName: workspace.name }}
                          className="text-xs"
                        >
                          {workspace.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          ) : null}

          {section && workspaceName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 capitalize hover:text-black hover:underline">
                    {sectionLabel}
                    <ChevronDownIcon size={15} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/dashboard/$workspaceName/monitors`}
                        params={{ workspaceName: workspaceName }}
                        className="text-xs"
                      >
                        Monitors
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/dashboard/$workspaceName/heartbeats`}
                        params={{ workspaceName: workspaceName }}
                        className="text-xs"
                      >
                        Heartbeats
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={"/dashboard/$workspaceName/logs"}
                        params={{ workspaceName: workspaceName }}
                        search={{ logId: undefined }}
                        className="text-xs"
                      >
                        Logs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={"/dashboard/$workspaceName/status-pages"}
                        params={{ workspaceName: workspaceName }}
                        className="text-xs"
                      >
                        Status Pages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link className="text-xs" to={"/dashboard/workspaces"}>
                        Workspaces
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="inline-flex flex-1 justify-end">{children}</div>
    </header>
  );
}
