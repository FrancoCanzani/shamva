import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ApiResponse, Workspace } from "../lib/types";

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
    throw new Error("No authentication session");
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

export function useWorkspaces(workspaceName?: string) {
  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
  });

  const currentWorkspace = workspaceName
    ? query.data?.find((w) => w.name === workspaceName)
    : query.data?.[0];

  return {
    workspaces: query.data ?? [],
    currentWorkspace,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
