import HeartbeatTable from "@/frontend/components/heartbeat/heartbeat-table";
import { Button } from "@/frontend/components/ui/button";
import { supabase } from "@/frontend/lib/supabase";
import type { Heartbeat } from "@/frontend/lib/types";
import {
  Route as HeartbeatsRoute,
  Route,
} from "@/frontend/routes/dashboard/$workspaceName/heartbeats/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import NotFoundMessage from "../not-found-message";

export default function HeartbeatsPage() {
  const navigate = useNavigate();
  const { workspaceName } = Route.useParams();
  const heartbeats = HeartbeatsRoute.useLoaderData();
  const queryClient = useQueryClient();

  const deleteHeartbeat = useMutation({
    mutationFn: async (heartbeatId: string): Promise<void> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/heartbeats/${heartbeatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to delete heartbeat");
      }
    },
    onSuccess: () => {
      // Invalidate and refetch heartbeats
      queryClient.invalidateQueries({ queryKey: ["heartbeats"] });
    },
  });

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
    // You could add a toast notification here
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
