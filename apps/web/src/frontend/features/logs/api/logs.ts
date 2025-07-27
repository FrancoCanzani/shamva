import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse, Log, Workspace } from "@/frontend/types/types";
import { redirect } from "@tanstack/react-router";

export async function fetchLogs({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<Log[]> {
  const workspaceNameFromParams = params.workspaceName;
  if (!workspaceNameFromParams) {
    console.warn(
      "Workspace name missing from route parameters, redirecting to workspace creation."
    );
    throw redirect({
      to: "/dashboard/workspaces/new",
      throw: true,
    });
  }

  try {
    const workspaceResponse = await fetch("/api/workspaces", {
      headers: {
        Authorization: `Bearer ${context.auth.session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (workspaceResponse.status === 401) {
      console.log(
        "API returned 401 fetching workspaces for logs, redirecting to login."
      );
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/${workspaceNameFromParams}/logs` },
        throw: true,
      });
    }

    if (!workspaceResponse.ok) {
      const errorText = await workspaceResponse.text();
      console.error(
        `Failed to fetch workspaces for logs: ${workspaceResponse.status} ${workspaceResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch workspaces for logs (Status: ${workspaceResponse.status})`
      );
    }

    const workspaceResult: ApiResponse<Workspace[]> =
      await workspaceResponse.json();

    if (!workspaceResult.success || !workspaceResult.data) {
      console.error(
        "API Error fetching workspaces for logs:",
        workspaceResult.error,
        workspaceResult.details
      );
      throw new Error(
        workspaceResult.error || "Failed to fetch workspaces from API for logs"
      );
    }

    const allWorkspaces = workspaceResult.data;
    const targetWorkspace = allWorkspaces.find(
      (ws) => ws.name === workspaceNameFromParams
    );

    if (!targetWorkspace) {
      console.warn(
        `Workspace with name "${workspaceNameFromParams}" not found for logs, redirecting.`
      );
      throw redirect({
        to: "/dashboard/workspaces/new",
        throw: true,
      });
    }

    const workspaceId = targetWorkspace.id;

    const logsResponse = await fetch(`/api/logs?workspaceId=${workspaceId}`, {
      headers: {
        Authorization: `Bearer ${context.auth.session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (logsResponse.status === 401) {
      console.log("API returned 401 fetching logs, redirecting to login.");
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/${workspaceNameFromParams}/logs` },
        throw: true,
      });
    }

    if (!logsResponse.ok) {
      const errorText = await logsResponse.text();
      console.error(
        `Failed to fetch logs: ${logsResponse.status} ${logsResponse.statusText}`,
        errorText
      );
      throw new Error(`Failed to fetch logs (Status: ${logsResponse.status})`);
    }

    const logsResult: ApiResponse<Log[]> = await logsResponse.json();

    if (!logsResult.success || !logsResult.data) {
      console.error(
        "API Error fetching logs:",
        logsResult.error,
        logsResult.details
      );
      throw new Error(logsResult.error || "Failed to fetch logs from API");
    }

    return logsResult.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    console.error("Error in fetchLogs loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load logs data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching logs data.");
  }
}
