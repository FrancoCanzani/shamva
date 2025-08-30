import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { ApiResponse, Workspace } from "@/frontend/lib/types";
import { RouterContext } from "@/frontend/routes/__root";
import { redirect } from "@tanstack/react-router";
import { Notifications } from "../types";

interface Params {
  workspaceName: string;
}

export async function fetchNotifications({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<Notifications> {
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

    const notificationsResponse = await fetch(
      `/api/v1/workspaces/${workspaceId}/notifications`,
      {
        headers: {
          Authorization: `Bearer ${context.auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (notificationsResponse.status === 401) {
      console.log(
        "API returned 401 fetching notifications, redirecting to login."
      );
      throw redirect({ to: "/auth/login", throw: true });
    }

    if (!notificationsResponse.ok) {
      const errorText = await notificationsResponse.text();
      console.error(
        `Failed to fetch notifications: ${notificationsResponse.status} ${notificationsResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch notifications (Status: ${notificationsResponse.status})`
      );
    }

    const notificationsResult: ApiResponse<Notifications> =
      await notificationsResponse.json();

    if (!notificationsResult.success || !notificationsResult.data) {
      console.error(
        "API Error fetching notifications:",
        notificationsResult.error,
        notificationsResult.details
      );
      throw new Error(
        notificationsResult.error || "Failed to fetch notifications from API"
      );
    }

    return notificationsResult.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    console.error("Error in fetchNotifications loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load notifications data: ${error.message}`);
    }
    throw new Error(
      "An unknown error occurred while fetching notifications data."
    );
  }
}
