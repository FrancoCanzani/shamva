import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/frontend/lib/supabase";
import type { Heartbeat } from "@/frontend/lib/types";
import HeartbeatForm from "@/frontend/components/heartbeat/heartbeat-form";
import { useWorkspaces } from "@/frontend/lib/context/workspace-context";
import { Route as NewHeartbeatRoute } from "@/frontend/routes/dashboard/$workspaceName/heartbeats/new";

export default function NewHeartbeatPage() {
  const navigate = useNavigate();
  const { currentWorkspace: workspace } = useWorkspaces();
  const queryClient = useQueryClient();
  const params = NewHeartbeatRoute.useParams();

  const createHeartbeat = useMutation({
    mutationFn: async (data: {
      name: string;
      expected_lapse_ms: number;
      grace_period_ms: number;
      workspace_id: string;
    }): Promise<Heartbeat> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/heartbeats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to create heartbeat");
      }

      const result = (await response.json()) as {
        success: boolean;
        data?: Heartbeat;
        error?: string;
      };
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create heartbeat");
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch heartbeats
      queryClient.invalidateQueries({ queryKey: ["heartbeats"] });
    },
  });

  const handleSubmit = async (data: {
    name: string;
    expected_lapse_ms: number;
    grace_period_ms: number;
    workspace_id: string;
  }) => {
    try {
      await createHeartbeat.mutateAsync(data);
      navigate({ to: `/dashboard/${params.workspaceName}/heartbeats` });
    } catch (error) {
      console.error("Failed to create heartbeat:", error);
    }
  };

  const handleCancel = () => {
    navigate({ to: `/dashboard/${params.workspaceName}/heartbeats` });
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
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
