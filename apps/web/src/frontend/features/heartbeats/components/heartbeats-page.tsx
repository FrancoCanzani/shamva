import DashboardHeader from "@/frontend/components/dashboard-header";
import NotFoundMessage from "@/frontend/components/not-found-message";
import { Button } from "@/frontend/components/ui/button";
import { Heartbeat } from "@/frontend/lib/types";
import {
  Route as HeartbeatsRoute,
  Route,
} from "@/frontend/routes/dashboard/$workspaceSlug/heartbeats/index";
import { Link, useNavigate } from "@tanstack/react-router";
import { useDeleteHeartbeat } from "../api/mutations";
import HeartbeatTable from "./heartbeat-table";

export default function HeartbeatsPage() {
  const navigate = useNavigate();
  const { workspaceSlug } = Route.useParams();
  const heartbeats = HeartbeatsRoute.useLoaderData();

  const deleteHeartbeat = useDeleteHeartbeat();

  const handleEdit = (heartbeat: Heartbeat) => {
    navigate({
      to: `/dashboard/${workspaceSlug}/heartbeats/${heartbeat.id}/edit`,
    });
  };

  const handleDelete = async (heartbeatId: string) => {
    try {
      await deleteHeartbeat.mutateAsync(heartbeatId);
    } catch (error) {
      console.error("Failed to delete heartbeat:", error);
    }
  };

  const handleCopyEndpoint = (heartbeatId: string) => {
    const endpointUrl = `/api/v1/heartbeat?id=${heartbeatId}`;
    navigator.clipboard.writeText(endpointUrl);
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader>
        <Button asChild variant={"outline"} size={"xs"}>
          <Link
            params={{ workspaceSlug: workspaceSlug }}
            to="/dashboard/$workspaceSlug/heartbeats/new"
          >
            New Heartbeat
          </Link>
        </Button>
      </DashboardHeader>

      <main className="relative flex-1 overflow-auto">
        <div className="mx-auto h-max max-w-4xl flex-1 space-y-8 overflow-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium">Heartbeats</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Monitor your services with heartbeat endpoints
            </p>
          </div>

          {heartbeats.length > 0 ? (
            <HeartbeatTable
              heartbeats={heartbeats}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopyEndpoint={handleCopyEndpoint}
            />
          ) : (
            <NotFoundMessage message="No Heartbeats found. Create one to get started." />
          )}
        </div>
      </main>
    </div>
  );
}
