import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { Workspace } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import {
  CheckIcon,
  ChevronsUpDown,
  Loader,
  PlusCircleIcon,
  Settings,
  UserPlus,
} from "lucide-react";

export default function WorkspaceDropdown() {
  const { workspaceSlug } = useParams({ strict: false });
  const { workspaces, currentWorkspace, isLoading, setCurrentWorkspace } =
    useWorkspaces(workspaceSlug);

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-input/50 inline-flex h-full w-full items-center justify-between p-2">
        <h1 className="pl-1 text-xl font-medium tracking-wide">Shamva</h1>
        {isLoading ? (
          <Loader className="animate-spin duration-75" />
        ) : (
          <ChevronsUpDown className="size-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]">
        {currentWorkspace && (
          <>
            <DropdownMenuLabel className="flex items-center justify-start space-x-1.5">
              <span className="text-sm font-medium capitalize">
                {currentWorkspace?.name}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-xs">
                <Settings className="size-3" />
                <Link
                  to="/dashboard/workspaces/$workspaceId"
                  params={{ workspaceId: currentWorkspace.id }}
                >
                  Manage Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => {
                  window.location.href = `/dashboard/workspaces/${currentWorkspace?.id}#members`;
                }}
              >
                <UserPlus className="size-3" />
                Invite Members
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            Workspaces
          </DropdownMenuLabel>
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
                <span className="text-xs capitalize">{workspace?.name}</span>
                {currentWorkspace?.slug === workspace.slug && (
                  <CheckIcon className="size-3" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No workspaces found</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <PlusCircleIcon className="size-3" />
          <Link className="text-xs" to="/dashboard/workspaces/new">
            New workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
