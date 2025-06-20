import { useWorkspaces as useWorkspacesContext } from "../lib/context/workspace-context";

export function useWorkspaces(workspaceName?: string) {
  const context = useWorkspacesContext();
  
  const currentWorkspace = workspaceName
    ? context.workspaces.find((w) => w.name === workspaceName)
    : context.currentWorkspace;

  return {
    workspaces: context.workspaces,
    currentWorkspace,
    isLoading: context.isLoading,
    error: context.error,
    refetch: context.refetch,
    setCurrentWorkspace: context.setCurrentWorkspace,
  };
}
