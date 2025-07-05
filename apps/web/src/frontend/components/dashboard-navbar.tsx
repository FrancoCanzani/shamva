import { Link, redirect, useParams } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useMemo } from "react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { Route } from "../routes/dashboard/route";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./ui/navigation-menu";
import { ThemeToggle } from "./ui/theme-toggle";
import { WorkspaceDropdown } from "./workspace-dropdown";

export function DashboardNavbar() {
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
    [currentWorkspace]
  );

  return (
    <header className="bg-background border-b border-dashed">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {currentWorkspace ? (
            <Link
              to="/dashboard/$workspaceName/monitors"
              params={{ workspaceName: currentWorkspace.name }}
              className="text-xl font-bold tracking-wide uppercase"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
            >
              Shamva
            </Link>
          ) : (
            <span
              className="tracking-wide[-5px] text-2xl font-bold"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
            >
              Shamva
            </span>
          )}

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.label}>
                  {currentWorkspace && !item.disabled ? (
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.to}
                        params={{ workspaceName: currentWorkspace.name }}
                        className={cn(
                          "hover:bg-accent px-2 py-1 font-mono text-sm",
                          "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                        )}
                        activeProps={{ "data-active": "true" }}
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <span className="px-3 py-2 font-mono text-sm opacity-50">
                      {item.label}
                    </span>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <WorkspaceDropdown />
          </div>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <div className="hidden md:block">
            <Button
              variant="outline"
              size={"xs"}
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

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p
                  className="tracking-wide[-5px] text-sm font-bold"
                  style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                >
                  Shamva
                </p>
              </div>
              <DropdownMenuSeparator />

              <div className="p-2">
                <WorkspaceDropdown />
              </div>
              <DropdownMenuSeparator />

              <div className="px-2 py-1.5">
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />

              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  asChild
                  disabled={item.disabled}
                >
                  {currentWorkspace && !item.disabled ? (
                    <Link
                      to={item.to}
                      params={{ workspaceName: currentWorkspace.name }}
                      className="w-full font-mono text-sm"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="w-full font-mono text-sm opacity-50">
                      {item.label}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  redirect({
                    to: "/",
                    throw: true,
                  });
                }}
                className="font-mono text-sm"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
