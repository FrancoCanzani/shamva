import { useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Workspace } from "@/frontend/types/types";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  invalidateWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

const CURRENT_WORKSPACE_KEY = "shamva-current-workspace";
const LAST_LOCATION_KEY = "shamva-last-location";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState<
    string | null
  >(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CURRENT_WORKSPACE_KEY);
    }
    return null;
  });

  const queryClient = useQueryClient();

  const data = queryClient.getQueryData<Workspace[]>(["workspaces"]);

  const workspaces = useMemo(() => data ?? [], [data]);

  const currentWorkspace = useMemo(() => {
    if (!currentWorkspaceId) {
      return workspaces.length > 0 ? workspaces[0] : null;
    }
    return workspaces.find((w) => w.id === currentWorkspaceId) || null;
  }, [workspaces, currentWorkspaceId]);

  const setCurrentWorkspace = useCallback(
    (workspace: Workspace | null) => {
      const workspaceId = workspace?.id || null;
      setCurrentWorkspaceId(workspaceId);

      if (typeof window !== "undefined") {
        if (workspaceId) {
          localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId);
          // Save current location before changing workspace
          localStorage.setItem(LAST_LOCATION_KEY, location.pathname);
        } else {
          localStorage.removeItem(CURRENT_WORKSPACE_KEY);
        }
      }

      if (workspace) {
        // Navigate to the last saved location or default to monitors
        const lastLocation = localStorage.getItem(LAST_LOCATION_KEY);
        const defaultPath = `/dashboard/${workspace.name}/monitors`;
        const targetPath =
          lastLocation &&
          lastLocation.includes("/dashboard/") &&
          !lastLocation.includes("/workspaces")
            ? lastLocation.replace(
                /\/dashboard\/[^/]+/,
                `/dashboard/${workspace.name}`
              )
            : defaultPath;

        navigate({ to: targetPath });
      }
    },
    [navigate, location.pathname]
  );

  useEffect(() => {
    if (
      currentWorkspaceId &&
      !workspaces.find((w) => w.id === currentWorkspaceId)
    ) {
      setCurrentWorkspace(workspaces.length > 0 ? workspaces[0] : null);
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspace]);

  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      isLoading: false,
      error: null,
      refetch: () =>
        queryClient
          .ensureQueryData({
            queryKey: ["workspaces"],
            queryFn: fetchWorkspaces,
          })
          .then(() => {}),
      invalidateWorkspaces: () =>
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
    }),
    [workspaces, currentWorkspace, setCurrentWorkspace, queryClient]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspaces must be used within a WorkspaceProvider");
  }
  return context;
}
