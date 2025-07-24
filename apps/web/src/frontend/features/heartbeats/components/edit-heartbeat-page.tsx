import { useWorkspaces } from "@/frontend/lib/context/workspace-context";
import { supabase } from "@/frontend/lib/supabase";
import { Route as EditHeartbeatRoute } from "@/frontend/routes/dashboard/$workspaceName/heartbeats/$id/edit";
import { Heartbeat } from "@/frontend/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import HeartbeatForm from "./heartbeat-form";

export default function EditHeartbeatPage() {
  const navigate = useNavigate();
  const { currentWorkspace: workspace } = useWorkspaces();
  const queryClient = useQueryClient();
  const heartbeat = EditHeartbeatRoute.useLoaderData();
  const params = EditHeartbeatRoute.useParams();

  const updateHeartbeat = useMutation({
    mutationFn: async (data: {
      name: string;
      expectedLapseMs: number;
      gracePeriodMs: number;
      workspaceId: string;
      pingId: string;
    }): Promise<Heartbeat> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`/api/heartbeats/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to update heartbeat");
      }

      const result = (await response.json()) as {
        success: boolean;
        data?: Heartbeat;
        error?: string;
      };
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to update heartbeat");
      }

      return result.data;
    },
    onSuccess: async () => {
      // Invalidate and refetch heartbeats
      await queryClient.invalidateQueries({ queryKey: ["heartbeats"] });
      navigate({ to: `/dashboard/${workspace?.name}/heartbeats` });
    },
  });

  const handleSubmit = async (data: {
    name: string;
    expectedLapseMs: number;
    gracePeriodMs: number;
    workspaceId: string;
    pingId: string;
  }) => {
    try {
      await updateHeartbeat.mutateAsync(data);
    } catch (error) {
      console.error("Failed to update heartbeat:", error);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/dashboard/${workspace?.name}/heartbeats` });
  };

  if (!workspace) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <HeartbeatForm
        workspaceId={workspace.id}
        heartbeat={heartbeat}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
