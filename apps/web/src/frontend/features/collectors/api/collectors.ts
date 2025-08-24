import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { Collector, Workspace } from "@/frontend/lib/types";
import { RouterContext } from "@/frontend/routes/__root";

export interface FetchCollectorsParams {
  params: { workspaceName: string };
  context: RouterContext;
}

export async function fetchCollectors({
  params,
  context,
}: FetchCollectorsParams) {
  const { workspaceName } = params;

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
      `/v1/api/collectors?workspaceId=${targetWorkspace.id}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch collectors");
    }

    const result = await response.json();
    return (result as { data: Collector[] }).data;
  } catch (error) {
    console.error("Error fetching collectors:", error);
    throw error;
  }
}
