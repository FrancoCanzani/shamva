import { useWorkspaces } from "@/frontend/lib/context/workspace-context";
import { Route as EditHeartbeatRoute } from "@/frontend/routes/dashboard/$workspaceSlug/heartbeats/$id/edit";
import { useNavigate } from "@tanstack/react-router";
import HeartbeatForm from "./heartbeat-form";
import { useUpdateHeartbeat } from "../api/mutations";

export default function EditHeartbeatPage() {
  const navigate = useNavigate();
  const { currentWorkspace: workspace } = useWorkspaces();
  const heartbeat = EditHeartbeatRoute.useLoaderData();
  const params = EditHeartbeatRoute.useParams();

  const updateHeartbeat = useUpdateHeartbeat();

  const handleSubmit = async (data: {
    name: string;
    expectedLapseMs: number;
    gracePeriodMs: number;
    workspaceId: string;
    pingId: string;
  }) => {
    try {
      await updateHeartbeat.mutateAsync({ heartbeatId: params.id, data });
      navigate({ to: `/dashboard/${workspace?.name}/heartbeats` });
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
