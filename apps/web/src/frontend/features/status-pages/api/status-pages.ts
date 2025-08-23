import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { ApiResponse, StatusPage, Workspace } from "@/frontend/lib/types";
import { RouterContext } from "@/frontend/routes/__root";
import { redirect } from "@tanstack/react-router";

export async function fetchStatusPages({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<StatusPage[]> {
  const workspaceName = params.workspaceName;
  if (!workspaceName) {
    throw redirect({
      to: "/dashboard/workspaces/new",
      throw: true,
    });
  }

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
      console.warn(
        `Workspace with name "${workspaceName}" not found, redirecting.`
      );
      throw redirect({
        to: "/dashboard/workspaces/new",
        throw: true,
      });
    }

    const statusPagesResponse = await fetch(
      `/api/status-pages?workspaceId=${targetWorkspace.id}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!statusPagesResponse.ok) {
      throw new Error(
        `Failed to fetch status pages (Status: ${statusPagesResponse.status})`
      );
    }

    const statusPagesResult: ApiResponse<StatusPage[]> =
      await statusPagesResponse.json();

    if (!statusPagesResult.success || !statusPagesResult.data) {
      throw new Error(
        statusPagesResult.error || "Failed to fetch status pages from API"
      );
    }

    return statusPagesResult.data;
  } catch (error) {
    console.error("Error in fetchStatusPages loader:", error);
    throw error;
  }
}
