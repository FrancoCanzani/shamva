import NotFoundMessage from "@/frontend/components/not-found-message";
import { Button } from "@/frontend/components/ui/button";
import {
  Route as HeartbeatsRoute,
  Route,
} from "@/frontend/routes/dashboard/$workspaceName/heartbeats/index";
import { Heartbeat } from "@/frontend/types/types";
import { Link, useNavigate } from "@tanstack/react-router";
import HeartbeatTable from "./heartbeat-table";
import { useRouteContext } from "@tanstack/react-router";
import { useDeleteHeartbeat } from "../api/mutations";

export default function HeartbeatsPage() {
  const navigate = useNavigate();
  const { workspaceName } = Route.useParams();
  const heartbeats = HeartbeatsRoute.useLoaderData();

  const deleteHeartbeat = useDeleteHeartbeat();

  const handleEdit = (heartbeat: Heartbeat) => {
    navigate({
      to: `/dashboard/${workspaceName}/heartbeats/${heartbeat.id}/edit`,
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
    const endpointUrl = `/api/heartbeat?id=${heartbeatId}`;
    navigator.clipboard.writeText(endpointUrl);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Heartbeats</h2>
          <p className="text-muted-foreground mt-1 hidden text-sm md:block">
            Monitor your services with heartbeat endpoints
          </p>
        </div>
        <Button asChild variant={"outline"} size={"xs"}>
          <Link
            params={{ workspaceName: workspaceName }}
            to="/dashboard/$workspaceName/heartbeats/new"
          >
            New Heartbeat
          </Link>
        </Button>
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
  );
}
