import type { Monitor } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { RadiobuttonIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import MonitorsCardAvailabilityDisplay from "./monitors-card-availability";
import RecentChecks from "./monitors-recent-checks";
import {
  calculateAvailability,
  calculateAverageLatency,
} from "./monitors-table-utils";

export const monitorsTableColumns: ColumnDef<Monitor>[] = [
  {
    id: "status",
    header: () => <RadiobuttonIcon />,
    cell: ({ row }) => (
      <div
        className={cn(
          "h-2 w-2 rounded-xs",
          row.original.status === "active"
            ? "bg-green-700"
            : row.original.status === "broken" ||
                row.original.status === "error"
              ? "bg-red-700"
              : row.original.status === "degraded"
                ? "bg-yellow-500"
                : row.original.status === "maintenance"
                  ? "bg-blue-700"
                  : row.original.status === "paused"
                    ? "bg-slate-500"
                    : "bg-carbon-200"
        )}
        title={`Status: ${row.original.status}`}
      />
    ),
    size: 16,
    minSize: 16,
    maxSize: 16,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Monitor",
    cell: ({ row }) => (
      <Link
        to="/dashboard/$workspaceName/monitors/$id"
        params={{ id: row.original.id, workspaceName: row.original.id || "" }}
        search={{ days: 7 }}
        className="truncate text-sm font-medium hover:underline"
      >
        {row.original.name ??
          (row.original.check_type === "tcp"
            ? row.original.tcp_host_port
            : row.original.url)}
      </Link>
    ),
    size: 200,
    minSize: 120,
  },
  {
    id: "statusText",
    header: "Status",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs capitalize">
        {row.original.status}
      </span>
    ),
    size: 80,
    minSize: 60,
  },
  {
    id: "lastChecked",
    header: "Last Checked",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.original.last_check_at
          ? formatDistanceToNowStrict(parseISO(row.original.last_check_at), {
              addSuffix: true,
            })
          : "-"}
      </span>
    ),
    size: 120,
    minSize: 80,
  },
  {
    id: "recentChecks",
    header: "Recent",
    cell: ({ row }) => <RecentChecks logs={row.original.recent_logs} />,
    size: 80,
    minSize: 60,
  },
  {
    id: "availability24h",
    header: "24h",
    cell: ({ row }) => (
      <MonitorsCardAvailabilityDisplay
        label="24h"
        availability={calculateAvailability(row.original.recent_logs, 24)}
      />
    ),
    size: 60,
    minSize: 40,
  },
  {
    id: "availability7d",
    header: "7d",
    cell: ({ row }) => (
      <MonitorsCardAvailabilityDisplay
        label="7d"
        availability={calculateAvailability(row.original.recent_logs, 7 * 24)}
      />
    ),
    size: 60,
    minSize: 40,
  },
  {
    id: "latency",
    header: "Latency",
    cell: ({ row }) => {
      const avgLatency = calculateAverageLatency(row.original.recent_logs);
      return (
        <span className="text-muted-foreground font-mono text-xs">
          {avgLatency !== null ? `${avgLatency.toFixed(0)}ms` : "-"}
        </span>
      );
    },
    size: 60,
    minSize: 40,
  },
  {
    id: "chevron",
    header: "",
    cell: () => (
      <ChevronRight
        size={16}
        className="text-carbon-400 opacity-60"
        aria-hidden="true"
      />
    ),
    size: 16,
    minSize: 16,
    maxSize: 16,
    enableSorting: false,
    enableHiding: false,
  },
];
