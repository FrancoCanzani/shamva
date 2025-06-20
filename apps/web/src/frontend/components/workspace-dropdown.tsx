import { Link, useLocation } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { useWorkspaces } from "../hooks/use-workspaces";
import { Workspace } from "../lib/types";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface WorkspaceDropdownProps {
  workspaceName?: string;
}

export function WorkspaceDropdown({ workspaceName }: WorkspaceDropdownProps) {
  const { workspaces, currentWorkspace, isLoading, setCurrentWorkspace } =
    useWorkspaces(workspaceName);
  const [open, setOpen] = React.useState(false);

  const location = useLocation();

  const handleSelectWorkspace = (workspace: Workspace) => {
    setOpen(false);
    setCurrentWorkspace(workspace);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={"xs"}
          className="flex justify-between w-full max-w-[240px]"
          disabled={isLoading}
        >
          {isLoading
            ? "Loading workspaces..."
            : currentWorkspace?.name || "Select workspace"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]">
        <DropdownMenuLabel className="text-xs">
          Your workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
                className="text-xs"
              >
                <span className="flex-1">{workspace.name}</span>
                {location.pathname.split("/").includes(workspace.name) && (
                  <CheckIcon size={14} />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No workspaces found</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/workspaces/new" className="text-xs">
            Create new workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
