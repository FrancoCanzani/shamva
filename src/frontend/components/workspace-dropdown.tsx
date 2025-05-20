import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDown, PlusCircle } from "lucide-react";
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
  const { workspaces, currentWorkspace, isLoading } =
    useWorkspaces(workspaceName);
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleSelectWorkspace = (workspace: Workspace) => {
    setOpen(false);
    navigate({
      to: "/dashboard/$workspaceName/monitors",
      params: {
        workspaceName: workspace.name,
      },
    });
  };

  const handleCreateWorkspace = () => {
    navigate({ to: "/dashboard/workspaces/new" });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
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
        <DropdownMenuLabel>Your workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
              >
                <span className="flex-1">{workspace.name}</span>
                {currentWorkspace?.id === workspace.id && (
                  <CheckIcon className="h-4 w-4 ml-2" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No workspaces found</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateWorkspace}>
          <PlusCircle className="h-4 w-4 mr-2" />
          <span>Create new workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
