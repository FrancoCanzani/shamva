import { Checkbox } from "@/frontend/components/ui/checkbox";
import { StatusDot } from "@/frontend/components/ui/status-dot";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { MonitorWithLastIncident } from "../../types";

export const columns: ColumnDef<MonitorWithLastIncident>[] = [
  {
    id: "select",
    header: () => <span className="sr-only">Select</span>,
    cell: ({ row }) => (
      <div className="flex w-full items-center justify-start">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          data-checkbox
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "status",
    accessorKey: "status",
    header: () => <span className="sr-only">Status</span>,
    cell: ({ row }) => {
      const monitor = row.original;
      return (
        <StatusDot
          pulse
          color={
            monitor.status === "active"
              ? "bg-green-600"
              : monitor.status === "error" || monitor.status === "broken"
                ? "bg-red-600"
                : monitor.status === "degraded"
                  ? "bg-yellow-500"
                  : monitor.status === "maintenance"
                    ? "bg-blue-600"
                    : monitor.status === "paused"
                      ? "bg-gray-500"
                      : "bg-gray-300"
          }
          size="sm"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const monitor = row.original;
      const url =
        monitor.check_type === "tcp" ? monitor.tcp_host_port : monitor.url;

      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{monitor.name}</span>
          <span className="text-muted-foreground font-mono text-xs">{url}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: "check_type",
    accessorKey: "check_type",
    header: () => <span className="sr-only">Type</span>,
    cell: () => null,
    enableSorting: false,
    enableHiding: true,
    size: 0,
    maxSize: 0,
    minSize: 0,
  },
  {
    id: "active_incident",
    header: () => <span className="sr-only">Active Incident</span>,
    cell: ({ row }) => {
      const monitor = row.original;
      if (monitor.last_incident?.status === "ongoing") {
        return (
          <div className="flex items-center justify-end">
            <span className="bg-muted animate-pulse rounded border px-1.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-50">
              Ongoing incident
            </span>
          </div>
        );
      }
      return null;
    },
    enableSorting: false,
    enableHiding: false,
    size: 60,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => {
      return (
        <div className="flex items-center justify-end">
          <ChevronRightIcon className="text-muted-foreground h-3 w-3" />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
];
