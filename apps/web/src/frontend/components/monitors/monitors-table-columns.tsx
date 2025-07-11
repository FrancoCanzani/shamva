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
    header: () => (
      <div className="flex w-full items-center justify-center">
        <RadiobuttonIcon />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex h-full items-center justify-center">
        <div
          className={cn(
            "h-2 w-2 rounded-md",
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
      </div>
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
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <Link
            to="/dashboard/$workspaceName/monitors/$id"
            params={{
              id: row.original.id,
              workspaceName: row.original.id || "",
            }}
            search={{ days: 7 }}
            className="truncate text-sm font-medium hover:underline"
          >
            {row.original.name ??
              (row.original.check_type === "tcp"
                ? row.original.tcp_host_port
                : row.original.url)}
          </Link>
          <span className="text-muted-foreground hidden truncate text-xs lg:block">
            {row.original.check_type === "tcp"
              ? row.original.tcp_host_port
              : row.original.url}
          </span>
        </div>
      </div>
    ),
    size: 200,
    minSize: 120,
    enableSorting: true,
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "check_type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-xs font-medium uppercase">
        {row.original.check_type}
      </span>
    ),
    size: 60,
    minSize: 40,
    enableSorting: true,
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="text-xs capitalize">{row.original.status}</span>
    ),
    size: 80,
    minSize: 60,
    enableSorting: true,
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "last_check_at",
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
    enableSorting: true,
    sortingFn: "datetime",
  },
  {
    id: "recentChecks",
    header: "Recent",
    cell: ({ row }) => <RecentChecks logs={row.original.recent_logs} />,
    size: 80,
    minSize: 60,
    enableSorting: false,
  },
  {
    accessorKey: "availability24h",
    header: "24h",
    accessorFn: (row) => calculateAvailability(row.recent_logs, 24).percentage,
    cell: ({ row }) => (
      <MonitorsCardAvailabilityDisplay
        label="24h"
        availability={calculateAvailability(row.original.recent_logs, 24)}
      />
    ),
    size: 60,
    minSize: 40,
    enableSorting: true,
  },
  {
    accessorKey: "availability7d",
    header: "7d",
    accessorFn: (row) =>
      calculateAvailability(row.recent_logs, 7 * 24).percentage,
    cell: ({ row }) => (
      <MonitorsCardAvailabilityDisplay
        label="7d"
        availability={calculateAvailability(row.original.recent_logs, 7 * 24)}
      />
    ),
    size: 60,
    minSize: 40,
    enableSorting: true,
  },
  {
    accessorKey: "latency",
    header: "Latency",
    accessorFn: (row) => calculateAverageLatency(row.recent_logs),
    cell: ({ row }) => {
      const avgLatency = calculateAverageLatency(row.original.recent_logs);
      return (
        <span className="font-mono text-xs">
          {avgLatency !== null ? `${avgLatency.toFixed(0)}ms` : "-"}
        </span>
      );
    },
    size: 60,
    minSize: 40,
    enableSorting: true,
  },
  {
    id: "chevron",
    header: "",
    cell: () => (
      <ChevronRight size={16} className="text-carbon-400 opacity-60" />
    ),
    size: 16,
    minSize: 16,
    maxSize: 16,
    enableSorting: false,
    enableHiding: false,
  },
];
