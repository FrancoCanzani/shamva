import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDown, PlusCircle } from "lucide-react";
import * as React from "react";
import { useWorkspace } from "../lib/context/workspace-context";
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

export function WorkspaceDropdown() {
  const { workspaces, selectedWorkspace, setSelectedWorkspace, isLoading } =
    useWorkspace();

  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleSelectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setOpen(false);
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
            : selectedWorkspace?.name || "Select workspace"}
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
                {selectedWorkspace?.id === workspace.id && (
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
