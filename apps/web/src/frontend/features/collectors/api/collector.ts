import { queryClient } from "@/frontend/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import { Workspace } from "@/frontend/lib/types";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { CollectorWithMetrics } from "../types";
import { RouterContext } from "@/frontend/routes/__root";
import { useRouteContext } from "@tanstack/react-router";

export interface FetchCollectorParams {
  params: { workspaceName: string; id: string };
  context: RouterContext;
  days: number;
}

export async function fetchCollector({
  params,
  context,
  days,
}: FetchCollectorParams) {
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

    const response = await fetch(
      `/v1/api/collectors/${id}?workspaceId=${targetWorkspace.id}&days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
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
  const context = useRouteContext({
    from: "/dashboard/$workspaceName/collectors/$id/",
  });
  return useQuery({
    queryKey: ["collector", workspaceName, id, days],
    queryFn: () =>
      fetchCollector({
        params: { workspaceName, id },
        context,
        days,
      }),
    staleTime: 30_000,
  });
}
