import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { ApiResponse, Workspace } from "@/frontend/lib/types";
import { RouterContext } from "@/frontend/routes/__root";
import { redirect } from "@tanstack/react-router";
import { CollectorWithMetrics } from "../types";

export interface FetchCollectorParams {
  params: { workspaceSlug: string; id: string };
  context: RouterContext;
  days?: number;
}

export async function fetchCollector({
  params,
  context,
  days = 7,
}: FetchCollectorParams) {
  const { workspaceSlug, id } = params;

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

    const collectorResponse = await fetch(
      `/api/v1/collectors/${id}?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (collectorResponse.status === 401) {
      console.log("API returned 401 fetching collector, redirecting to login.");
      throw redirect({ to: "/auth/log-in", throw: true });
    }

    if (collectorResponse.status === 404) {
      throw new Error("Collector not found");
    }

    if (!collectorResponse.ok) {
      const errorText = await collectorResponse.text();
      console.error(
        `Failed to fetch collector: ${collectorResponse.status} ${collectorResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch collector (Status: ${collectorResponse.status})`
      );
    }

    const collectorResult: ApiResponse<CollectorWithMetrics> =
      await collectorResponse.json();

    if (!collectorResult.success || !collectorResult.data) {
      console.error(
        "API Error fetching collector:",
        collectorResult.error,
        collectorResult.details
      );
      throw new Error(
        collectorResult.error || "Failed to fetch collector from API"
      );
    }

    return collectorResult.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    console.error("Error in fetchCollector loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load collector data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching collector data.");
  }
}
