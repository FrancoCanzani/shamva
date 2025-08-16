import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { ApiResponse, Workspace } from "@/frontend/lib/types";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Notifications } from "../types";

export const useUpdateWorkspaceNotifications = (workspaceName: string) => {
  const context = useRouteContext({
    from: "/dashboard/$workspaceName/notifications/",
  });
  const router = useRouter();

  return useMutation({
    mutationFn: async (
      config: Partial<Notifications>
    ): Promise<Notifications> => {
      if (!context.auth.session?.access_token) {
        throw new Error("Authentication required");
      }

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
        throw new Error(`Workspace with name "${workspaceName}" not found`);
      }

      const workspaceId = targetWorkspace.id;

      const response = await fetch(
        `/api/workspaces/${workspaceId}/notifications`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${context.auth.session.access_token}`,
          },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to update notifications: ${response.status}`,
          errorText
        );
        throw new Error(
          `Failed to update workspace notifications (Status: ${response.status})`
        );
      }

      const result: ApiResponse<Notifications> = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Failed to update workspace notifications"
        );
      }

      return result.data!;
    },
    onSuccess: () => {
      router.invalidate();
    },
  });
};
