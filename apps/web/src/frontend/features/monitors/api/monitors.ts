import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse, Monitor, Workspace } from "@/frontend/types/types";
import { redirect } from "@tanstack/react-router";

export async function fetchMonitors({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<Monitor[]> {
  const workspaceName = params.workspaceName;


  try {
    const workspaceResponse = await fetch("/api/workspaces", {
      headers: {
        Authorization: `Bearer ${context.auth.session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (workspaceResponse.status === 401) {
      console.log(
        "API returned 401 fetching workspaces, redirecting to login."
      );
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/${workspaceName}/monitors` },
        throw: true,
      });
    }

    if (!workspaceResponse.ok) {
      const errorText = await workspaceResponse.text();
      console.error(
        `Failed to fetch workspaces: ${workspaceResponse.status} ${workspaceResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch workspaces (Status: ${workspaceResponse.status})`
      );
    }

    const workspaceResult: ApiResponse<Workspace[]> =
      await workspaceResponse.json();

    if (!workspaceResult.success || !workspaceResult.data) {
      console.error(
        "API Error fetching workspaces:",
        workspaceResult.error,
        workspaceResult.details
      );
      throw new Error(
        workspaceResult.error || "Failed to fetch workspaces from API"
      );
    }

    const allWorkspaces = workspaceResult.data;
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

    const monitorsResponse = await fetch(
      `/api/monitors?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (monitorsResponse.status === 401) {
      console.log("API returned 401 fetching monitors, redirecting to login.");
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/${workspaceName}/monitors` },
        throw: true,
      });
    }

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

    const monitorsResult: ApiResponse<Monitor[]> =
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
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    console.error("Error in fetchMonitors loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load monitors data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching monitors data.");
  }
}
