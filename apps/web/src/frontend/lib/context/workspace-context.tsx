import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  invalidateWorkspaces: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

async function fetchWorkspaces() {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error("Failed to get authentication session");
  }
  const response = await fetch("/api/workspaces", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
  const queryClient = useQueryClient();
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
      const { data: sessionData } = await supabase.auth.getSession();
      setIsAuthenticated(!!sessionData?.session?.access_token);
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

  // Memoize workspaces array to prevent unnecessary re-renders
  const workspaces = useMemo(() => query.data ?? [], [query.data]);

  // Memoize current workspace calculation
  const currentWorkspace = useMemo(() => {
    if (!currentWorkspaceId) {
      return workspaces.length > 0 ? workspaces[0] : null;
    }
    return workspaces.find((w) => w.id === currentWorkspaceId) || null;
  }, [workspaces, currentWorkspaceId]);

  // Memoize the setCurrentWorkspace function to prevent re-renders
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

  // Memoize the invalidate function to prevent re-renders
  const invalidateWorkspaces = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  }, [queryClient]);

  // Memoize loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => {
    return isAuthenticated === null || query.isLoading;
  }, [isAuthenticated, query.isLoading]);

  // Memoize error state to prevent unnecessary re-renders
  const error = useMemo(() => {
    return query.error ? (query.error as Error).message : null;
  }, [query.error]);

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

  // Memoize the context value with stable references
  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      isLoading,
      error,
      refetch: query.refetch,
      invalidateWorkspaces,
    }),
    [
      workspaces,
      currentWorkspace,
      setCurrentWorkspace,
      isLoading,
      error,
      query.refetch,
      invalidateWorkspaces,
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
