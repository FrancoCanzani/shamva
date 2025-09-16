import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDown, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import { useWorkspaces } from "../hooks/use-workspaces";
import { useTheme } from "../lib/context/theme-context";
import supabase from "../lib/supabase";
import { Workspace } from "../lib/types";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function SidebarDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams({ strict: false });
  const { workspaces, currentWorkspace, setCurrentWorkspace } =
    useWorkspaces(workspaceSlug);
  const { theme, setTheme } = useTheme();

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate({
        to: "/",
      });
    } catch {
      toast.error("Error signing out. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-input/50 inline-flex h-full w-full items-center justify-between p-2">
        <div className="flex flex-col items-start pl-1">
          <h1 className="text-sm font-medium">{user?.user_metadata.name}</h1>
          <span className="text-muted-foreground truncate text-xs">
            {user?.email}
          </span>
        </div>

        <ChevronsUpDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="center">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/settings" className="text-xs">
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs [&_svg]:size-3">
              <span className="flex-1">Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="rounded-sm">
                <DropdownMenuItem
                  className={cn(
                    "flex items-center justify-between text-xs",
                    theme === "light" && "bg-input/50 rounded-md"
                  )}
                  onClick={() => setTheme("light")}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="size-3" />
                    <span>Light</span>
                  </div>
                  {theme === "light" && <CheckIcon className="size-3" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "flex items-center justify-between text-xs",
                    theme === "dark" && "bg-input/50 rounded-md"
                  )}
                  onClick={() => setTheme("dark")}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="size-3" />
                    <span>Dark</span>
                  </div>
                  {theme === "dark" && <CheckIcon className="size-3" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "flex items-center justify-between text-xs",
                    theme === "system" && "bg-input/50 rounded-md"
                  )}
                  onClick={() => setTheme("system")}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className="size-3" />
                    <span>System</span>
                  </div>
                  {theme === "system" && <CheckIcon className="size-3" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs [&_svg]:size-3">
              <span className="flex-1">Switch workspaces</span>
              <div className="flex items-center gap-2">
                <DropdownMenuShortcut>⇧W</DropdownMenuShortcut>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="rounded-sm">
                {workspaces.length > 0 ? (
                  workspaces.map((workspace) => (
                    <DropdownMenuItem
                      className={cn(
                        "flex items-center justify-between text-xs",
                        currentWorkspace?.slug === workspace.slug &&
                          "bg-input/50 rounded-md"
                      )}
                      key={workspace.id}
                      onClick={() => handleSelectWorkspace(workspace)}
                    >
                      <span className="flex-1 capitalize">
                        {workspace?.name}
                      </span>
                      {currentWorkspace?.slug === workspace.slug && (
                        <CheckIcon className="size-3" />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="text-xs">
                    No workspaces found
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link className="text-xs" to="/dashboard/workspaces/new">
                    New workspace
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          {currentWorkspace && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  to="/dashboard/workspaces/$workspaceId"
                  params={{ workspaceId: currentWorkspace.id }}
                  className="text-xs"
                >
                  Manage Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = `/dashboard/workspaces/${currentWorkspace?.id}#members`;
                }}
                className="text-xs"
              >
                Invite Members
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="text-xs"
          onClick={() => handleSignOut()}
        >
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
