import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/frontend/lib/supabase";
import type { Heartbeat } from "@/frontend/lib/types";
import { useWorkspaces } from "@/frontend/lib/context/workspace-context";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import HeartbeatTable from "@/frontend/components/heartbeat/heartbeat-table";
import { Route as HeartbeatsRoute } from "@/frontend/routes/dashboard/$workspaceName/heartbeats/index";

export default function HeartbeatsPage() {
  const navigate = useNavigate();
  const { currentWorkspace: workspace } = useWorkspaces();
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
      to: `/dashboard/${workspace?.name}/heartbeats/${heartbeat.id}/edit`,
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
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Heartbeats</h1>
          <p className="text-muted-foreground">
            Monitor your services with heartbeat endpoints
          </p>
        </div>
        <Button
          onClick={() =>
            navigate({ to: `/dashboard/${workspace.name}/heartbeats/new` })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          New Heartbeat
        </Button>
      </div>

      {deleteHeartbeat.error && (
        <Alert variant="destructive">
          <AlertDescription>{deleteHeartbeat.error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Heartbeats</CardTitle>
        </CardHeader>
        <CardContent>
          {heartbeats.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No heartbeats found. Create your first heartbeat to get started.
              </p>
              <Button
                onClick={() =>
                  navigate({
                    to: `/dashboard/${workspace.name}/heartbeats/new`,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Heartbeat
              </Button>
            </div>
          ) : (
            <HeartbeatTable
              heartbeats={heartbeats}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopyEndpoint={handleCopyEndpoint}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
