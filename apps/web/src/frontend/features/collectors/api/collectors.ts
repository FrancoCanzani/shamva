import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { ApiResponse, Workspace } from "@/frontend/lib/types";
import { RouterContext } from "@/frontend/routes/__root";
import { redirect } from "@tanstack/react-router";
import { CollectorWithLastMetrics } from "../types";

export interface FetchCollectorsParams {
  params: { workspaceSlug: string };
  context: RouterContext;
}

export async function fetchCollectors({
  params,
  context,
}: FetchCollectorsParams) {
  const { workspaceSlug } = params;

  if (!workspaceSlug) {
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

    const workspaceId = targetWorkspace.id;

    const collectorsResponse = await fetch(
      `/api/v1/collectors?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (collectorsResponse.status === 401) {
      console.log(
        "API returned 401 fetching collectors, redirecting to login."
      );
      throw redirect({ to: "/auth/log-in", throw: true });
    }

    if (!collectorsResponse.ok) {
      const errorText = await collectorsResponse.text();
      console.error(
        `Failed to fetch collectors: ${collectorsResponse.status} ${collectorsResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch collectors (Status: ${collectorsResponse.status})`
      );
    }

    const collectorsResult: ApiResponse<CollectorWithLastMetrics[]> =
      await collectorsResponse.json();

    if (!collectorsResult.success || !collectorsResult.data) {
      console.error(
        "API Error fetching collectors:",
        collectorsResult.error,
        collectorsResult.details
      );
      throw new Error(
        collectorsResult.error || "Failed to fetch collectors from API"
      );
    }

    return collectorsResult.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    console.error("Error in fetchCollectors loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load collectors data: ${error.message}`);
    }
    throw new Error(
      "An unknown error occurred while fetching collectors data."
    );
  }
}
