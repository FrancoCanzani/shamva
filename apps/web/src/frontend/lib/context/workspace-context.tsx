import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../supabase";
import { ApiResponse, Workspace } from "../types";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

async function fetchWorkspaces() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session Error:", sessionError);
    throw new Error("Failed to get authentication session");
  }

  if (!session?.access_token) {
    return [];
  }

  const response = await fetch("/api/workspaces", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  const data: ApiResponse<Workspace[]> = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch workspaces");
  }

  return data.data;
}

const CURRENT_WORKSPACE_KEY = "shamva-current-workspace";
const LAST_LOCATION_KEY = "shamva-last-location";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState<
    string | null
  >(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CURRENT_WORKSPACE_KEY);
    }
    return null;
  });

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.access_token);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on authentication errors
    enabled: isAuthenticated === true, // Only run query when authenticated
  });

  const workspaces = useMemo(() => query.data ?? [], [query.data]);
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
    // Only redirect to create workspace if we're authenticated and have no workspaces
    if (
      isAuthenticated &&
      !query.isLoading &&
      workspaces.length === 0 &&
      !query.error
    ) {
      // Only redirect if we're not already on the workspaces page
      if (!location.pathname.includes("/workspaces")) {
        navigate({ to: "/dashboard/workspaces/new" });
      }
    }
  }, [
    isAuthenticated,
    workspaces.length,
    query.isLoading,
    query.error,
    navigate,
    location.pathname,
  ]);

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
      isLoading: isAuthenticated === null || query.isLoading,
      error: query.error ? (query.error as Error).message : null,
      refetch: query.refetch,
    }),
    [
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      isAuthenticated,
      query.isLoading,
      query.error,
      query.refetch,
    ]
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
