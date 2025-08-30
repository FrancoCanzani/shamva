import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse, Heartbeat, Workspace } from "@/frontend/lib/types";
import { queryClient } from "@/frontend/lib/query-client";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { redirect } from "@tanstack/react-router";

export async function fetchHeartbeats({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<Heartbeat[]> {
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

    const workspaceId = targetWorkspace.id;

    const heartbeatsResponse = await fetch(
      `/api/v1/heartbeats?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (heartbeatsResponse.status === 401) {
      console.log(
        "API returned 401 fetching heartbeats, redirecting to login."
      );
      throw redirect({ to: "/auth/login", throw: true });
    }

    if (!heartbeatsResponse.ok) {
      const errorText = await heartbeatsResponse.text();
      console.error(
        `Failed to fetch heartbeats: ${heartbeatsResponse.status} ${heartbeatsResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch heartbeats (Status: ${heartbeatsResponse.status})`
      );
    }

    const heartbeatsResult: ApiResponse<Heartbeat[]> =
      await heartbeatsResponse.json();

    if (!heartbeatsResult.success || !heartbeatsResult.data) {
      console.error(
        "API Error fetching heartbeats:",
        heartbeatsResult.error,
        heartbeatsResult.details
      );
      throw new Error(
        heartbeatsResult.error || "Failed to fetch heartbeats from API"
      );
    }

    return heartbeatsResult.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    console.error("Error in fetchHeartbeats loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load heartbeats data: ${error.message}`);
    }
    throw new Error(
      "An unknown error occurred while fetching heartbeats data."
    );
  }
}
