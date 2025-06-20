import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Plus, Settings, Users } from "lucide-react";
import * as React from "react";
import { useWorkspaces } from "../hooks/use-workspaces";
import { useWorkspacePermissions } from "../hooks/use-workspace-permissions";
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
import { Badge } from "./ui/badge";

interface WorkspaceSelectorProps {
  workspaceName?: string;
  className?: string;
}

export function WorkspaceSelector({ workspaceName, className }: WorkspaceSelectorProps) {
  const { workspaces, currentWorkspace, isLoading, setCurrentWorkspace } =
    useWorkspaces(workspaceName);
  const { permissions } = useWorkspacePermissions(workspaceName);
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleSelectWorkspace = (workspace: Workspace) => {
    setOpen(false);
    setCurrentWorkspace(workspace);
  };

  const handleCreateWorkspace = () => {
    navigate({ to: "/dashboard/workspaces/new" });
    setOpen(false);
  };

  const handleManageWorkspace = () => {
    if (currentWorkspace) {
      navigate({
        to: "/dashboard/workspaces/$workspaceId",
        params: { workspaceId: currentWorkspace.id },
      });
    }
    setOpen(false);
  };

  const handleManageWorkspaces = () => {
    navigate({ to: "/dashboard/workspaces" });
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center justify-between w-full ${className}`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
            <span className="font-medium truncate">
              {currentWorkspace?.name || "Select workspace"}
            </span>
            {permissions.canManageWorkspace && (
              <Badge variant="secondary" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="text-xs font-medium">
          Current Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {currentWorkspace && (
          <DropdownMenuItem
            className="flex items-center gap-2 py-2"
            disabled
          >
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{currentWorkspace.name}</div>
              {currentWorkspace.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {currentWorkspace.description}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        )}

        {permissions.canManageWorkspace && (
          <DropdownMenuItem onClick={handleManageWorkspace}>
            <Settings className="h-4 w-4 mr-2" />
            <span className="text-xs">Manage Workspace</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium">
          Switch Workspace
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {workspaces.length > 0 ? (
            workspaces
              .filter((w) => w.id !== currentWorkspace?.id)
              .map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace)}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{workspace.name}</div>
                    {workspace.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {workspace.description}
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))
          ) : (
            <DropdownMenuItem disabled>
              <span className="text-xs">No other workspaces</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateWorkspace}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="text-xs">Create New Workspace</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleManageWorkspaces}>
          <Users className="h-4 w-4 mr-2" />
          <span className="text-xs">Manage All Workspaces</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 