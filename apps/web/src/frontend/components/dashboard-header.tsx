import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";
import { Route } from "../routes/dashboard/route";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
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

  // Determine the section (monitors, heartbeats, etc.)
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
    <header className="flex items-center gap-4 border-b px-4 py-2">
      <SidebarTrigger />

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

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

      <Separator orientation="vertical" />

      <div className="inline-flex flex-1 justify-end">{children}</div>
    </header>
  );
}
