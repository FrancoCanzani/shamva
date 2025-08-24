import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { useWorkspaces } from "@/frontend/lib/context/workspace-context";
import { Heartbeat } from "@/frontend/lib/types";
import { Route as HeartbeatRoute } from "@/frontend/routes/dashboard/$workspaceName/heartbeats/$id/index";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowLeft, Edit } from "lucide-react";

export default function HeartbeatPage() {
  const navigate = useNavigate();
  const { currentWorkspace: workspace } = useWorkspaces();
  const heartbeat = HeartbeatRoute.useLoaderData();

  const getStatusBadge = (heartbeat: Heartbeat) => {
    const now = new Date();
    const lastBeat = heartbeat.last_beat_at
      ? new Date(heartbeat.last_beat_at)
      : null;
    const timeoutMs = heartbeat.expected_lapse_ms + heartbeat.grace_period_ms;

    if (heartbeat.status === "timeout") {
      return <Badge variant="destructive">Timed Out</Badge>;
    }

    if (heartbeat.status === "paused") {
      return <Badge variant="secondary">Paused</Badge>;
    }

    if (!lastBeat) {
      return <Badge variant="secondary">No Heartbeats</Badge>;
    }

    const timeSinceLastBeat = now.getTime() - lastBeat.getTime();

    if (timeSinceLastBeat > timeoutMs) {
      return <Badge variant="destructive">Timed Out</Badge>;
    }

    if (timeSinceLastBeat > heartbeat.expected_lapse_ms) {
      return <Badge variant="secondary">Late</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleCopyEndpoint = () => {
    const endpointUrl = `/v1/api/heartbeat?id=${heartbeat.id}`;
    navigator.clipboard.writeText(endpointUrl);
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() =>
            navigate({ to: `/dashboard/${workspace?.name}/heartbeats` })
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Heartbeats
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{heartbeat.name}</h1>
          <p className="text-muted-foreground">Heartbeat Details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyEndpoint}>
            <Activity className="mr-2 h-4 w-4" />
            Copy Endpoint
          </Button>
          <Button
            onClick={() =>
              navigate({
                to: `/dashboard/${workspace?.name}/heartbeats/${heartbeat.id}/edit`,
              })
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Status</span>
                {getStatusBadge(heartbeat)}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Last Heartbeat</span>
                <span>
                  {heartbeat.last_beat_at ? (
                    <span
                      title={new Date(heartbeat.last_beat_at).toLocaleString()}
                    >
                      {formatDistanceToNow(new Date(heartbeat.last_beat_at), {
                        addSuffix: true,
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Expected Lapse</span>
                <span>{formatDuration(heartbeat.expected_lapse_ms)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Grace Period</span>
                <span>{formatDuration(heartbeat.grace_period_ms)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Timeout</span>
                <span>
                  {formatDuration(
                    heartbeat.expected_lapse_ms + heartbeat.grace_period_ms
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 rounded p-2 text-sm">
              /v1/api/heartbeat?id={heartbeat.id}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyEndpoint}>
              Copy
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Use this URL to send heartbeat signals from your application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
