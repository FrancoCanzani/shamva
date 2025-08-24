import { queryClient } from "@/frontend/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import { Workspace } from "@/frontend/lib/types";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { CollectorWithMetrics } from "../types";

export interface FetchCollectorParams {
  params: { workspaceName: string; id: string };
  context: any;
  days: number;
}

export async function fetchCollector({ params, context, days }: FetchCollectorParams) {
  const { workspaceName, id } = params;
  
  try {
    const allWorkspaces: Workspace[] =
      queryClient.getQueryData<Workspace[]>(["workspaces"]) ??
      (await queryClient.ensureQueryData<Workspace[]>({
        queryKey: ["workspaces"],
        queryFn: fetchWorkspaces,
      }));

    const targetWorkspace = allWorkspaces.find(
      (ws) => ws.name === workspaceName
    );
    
    if (!targetWorkspace) {
      throw new Error("Workspace not found");
    }

    const token = context?.auth?.session?.access_token;
    const response = await fetch(
      `/v1/api/collectors/${id}?workspaceId=${targetWorkspace.id}&days=${days}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch collector");
    }

    const result = await response.json();
    return (result as { data: CollectorWithMetrics }).data;
  } catch (error) {
    console.error("Error fetching collector:", error);
    throw error;
  }
}

export function useCollector(workspaceName: string, id: string, days: number) {
  return useQuery({
    queryKey: ["collector", workspaceName, id, days],
    queryFn: () => fetchCollector({ params: { workspaceName, id }, context: { queryClient }, days }),
    staleTime: 30_000,
  });
}
