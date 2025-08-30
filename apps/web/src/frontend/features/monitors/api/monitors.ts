import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { ApiResponse, Workspace } from "@/frontend/lib/types";
import { RouterContext } from "@/frontend/routes/__root";
import { redirect } from "@tanstack/react-router";
import { MonitorWithMetrics } from "../types";

export async function fetchMonitors({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<MonitorWithMetrics[]> {
  const workspaceSlug = params.workspaceSlug;

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

    const workspaceId = targetWorkspace.id;

    const monitorsResponse = await fetch(
      `/api/v1/monitors?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!monitorsResponse.ok) {
      const errorText = await monitorsResponse.text();
      console.error(
        `Failed to fetch monitors: ${monitorsResponse.status} ${monitorsResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch monitors (Status: ${monitorsResponse.status})`
      );
    }

    const monitorsResult: ApiResponse<MonitorWithMetrics[]> =
      await monitorsResponse.json();

    if (!monitorsResult.success || !monitorsResult.data) {
      console.error(
        "API Error fetching monitors:",
        monitorsResult.error,
        monitorsResult.details
      );
      throw new Error(
        monitorsResult.error || "Failed to fetch monitors from API"
      );
    }

    return monitorsResult.data;
  } catch (error) {
    console.error("Error in fetchMonitors loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load monitors data: ${error.message}`);
    }
    throw new Error("Failed to load monitors data: Unknown error");
  }
}
