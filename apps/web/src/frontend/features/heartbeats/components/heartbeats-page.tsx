import DashboardHeader from "@/frontend/components/dashboard-header";
import NoDataMessage from "@/frontend/components/no-data-message";
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
        <div className="mx-auto h-full max-w-4xl space-y-8 overflow-auto p-6">
          {heartbeats.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium">Heartbeats</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Monitor your services with heartbeat endpoints
              </p>
            </div>
          )}

          {heartbeats.length > 0 ? (
            <HeartbeatTable
              heartbeats={heartbeats}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopyEndpoint={handleCopyEndpoint}
            />
          ) : (
            <NoDataMessage
              title="Heartbeats"
              description="A Heartbeat monitor is a passive check type that expects pings from an external source, such as a scheduled job on a server, at a defined interval. A ping is an HTTP request to a given endpoint URL using either the GET or POST method. When a ping is not received on time, the check will trigger any configured alerts."
              primaryAction={{
                label: "New Heartbeat",
                to: "/dashboard/$workspaceSlug/heartbeats/new",
              }}
              secondaryAction={{
                label: "Documentation",
                href: "https://docs.shamva.io/heartbeats",
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
