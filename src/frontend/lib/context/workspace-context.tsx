import { redirect } from "@tanstack/react-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../supabase";
import { ApiResponse, Workspace } from "../types";

interface WorkspaceContextType {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  setSelectedWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    setError(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session Error:", sessionError);
      throw new Error("Failed to get authentication session");
    }

    if (!session?.access_token) {
      throw redirect({
        to: "/auth/login",
        throw: true,
      });
    }

    const token = session.access_token;

    try {
      const response = await fetch("/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data: ApiResponse<Workspace[]> = await response.json();

      if (data.success && data.data) {
        setWorkspaces(data.data);
        if (data.data.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(data.data[0]);
        }
      } else {
        setError(data.error || "Failed to fetch workspaces");
      }
    } catch (err) {
      setError("An error occurred while fetching workspaces");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        selectedWorkspace,
        isLoading,
        error,
        setSelectedWorkspace,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
