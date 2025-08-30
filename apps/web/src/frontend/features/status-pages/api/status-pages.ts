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
  const workspaceSlug = params.workspaceSlug;
  if (!workspaceSlug) {
    throw redirect({
      to: "/dashboard/workspaces/new",
      throw: true,
    });
  }

  try {
    await queryClient.ensureQueryData({
      queryKey: ["workspaces"],
      queryFn: fetchWorkspaces,
    });

    const allWorkspaces: Workspace[] =
      queryClient.getQueryData<Workspace[]>(["workspaces"]) ?? [];

    const targetWorkspace = allWorkspaces.find(
      (ws) => ws.slug === workspaceSlug
    );

    if (!targetWorkspace) {
      console.warn(
        `Workspace with slug "${workspaceSlug}" not found, redirecting.`
      );
      throw redirect({
        to: "/dashboard/workspaces/new",
        throw: true,
      });
    }

    const statusPagesResponse = await fetch(
      `/api/v1/status-pages?workspaceId=${targetWorkspace.id}`,
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
