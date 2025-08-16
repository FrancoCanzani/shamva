import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Heartbeat } from "@/frontend/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Activity, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface HeartbeatTableProps {
  heartbeats: Heartbeat[];
  onEdit: (heartbeat: Heartbeat) => void;
  onDelete: (heartbeatId: string) => void;
  onCopyEndpoint: (heartbeatId: string) => void;
}

export default function HeartbeatTable({
  heartbeats,
  onEdit,
  onDelete,
  onCopyEndpoint,
}: HeartbeatTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (heartbeatId: string) => {
    setDeletingId(heartbeatId);
    try {
      await onDelete(heartbeatId);
    } finally {
      setDeletingId(null);
    }
  };

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

  return (
    <div className="rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expected Lapse</TableHead>
            <TableHead>Grace Period</TableHead>
            <TableHead>Last Beat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {heartbeats.map((heartbeat) => (
            <TableRow key={heartbeat.id}>
              <TableCell className="font-medium">{heartbeat.name}</TableCell>
              <TableCell>{getStatusBadge(heartbeat)}</TableCell>
              <TableCell>
                {formatDuration(heartbeat.expected_lapse_ms)}
              </TableCell>
              <TableCell>{formatDuration(heartbeat.grace_period_ms)}</TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopyEndpoint(heartbeat.id)}
                    title="Copy endpoint URL"
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(heartbeat)}
                    title="Edit heartbeat"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(heartbeat.id)}
                    disabled={deletingId === heartbeat.id}
                    title="Delete heartbeat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
