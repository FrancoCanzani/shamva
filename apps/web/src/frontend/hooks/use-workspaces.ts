import { useWorkspaces as useWorkspacesContext } from "../lib/context/workspace-context";

export function useWorkspaces(workspaceSlug?: string) {
  const context = useWorkspacesContext();

  const currentWorkspace = workspaceSlug
    ? context.workspaces.find((w) => w.slug === workspaceSlug)
    : context.currentWorkspace;

  return {
    workspaces: context.workspaces,
    currentWorkspace,
    isLoading: context.isLoading,
    error: context.error,
    refetch: context.refetch,
    setCurrentWorkspace: context.setCurrentWorkspace,
    invalidateWorkspaces: context.invalidateWorkspaces,
  };
}
