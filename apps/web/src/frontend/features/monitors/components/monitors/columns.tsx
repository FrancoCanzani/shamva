import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { StatusDot } from "@/frontend/components/ui/status-dot";
import { Monitor } from "@/frontend/types/types";
import { cn } from "@/frontend/utils/utils";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";

export function createColumns(workspaceName: string): ColumnDef<Monitor>[] {
  return [
    {
      accessorKey: "check_type",
      header: ({ column }) => (
        <button
          type="button"
          className="group text-muted-foreground flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Type
          <div className="h-3 w-3">
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="h-3 w-3" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </div>
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs font-medium uppercase">
          {row.getValue("check_type")}
        </span>
      ),
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        return row.getValue(columnId) === filterValue;
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          type="button"
          className="group text-muted-foreground flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Name
          <div className="h-3 w-3">
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="h-3 w-3" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </div>
        </button>
      ),
      cell: ({ row }) => {
        const monitor = row.original;
        return (
          <div className="flex items-center space-x-3">
            <StatusDot
              pulse={monitor.status === "active"}
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
            <div className="min-w-0 flex-1">
              <span className="font-medium">
                {monitor.name ||
                  (monitor.check_type === "tcp"
                    ? monitor.tcp_host_port
                    : monitor.url)}
              </span>
              <p className="text-muted-foreground truncate font-mono text-xs">
                {monitor.check_type === "tcp"
                  ? monitor.tcp_host_port
                  : monitor.url}
              </p>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <button
          type="button"
          className="group text-muted-foreground flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Status
          <div className="h-3 w-3">
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="h-3 w-3" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </div>
        </button>
      ),
      cell: ({ row }) => (
        <span className={cn("text-xs font-medium capitalize")}>
          {row.getValue("status")}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "incidents",
      header: ({ column }) => (
        <button
          type="button"
          className="group text-muted-foreground flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Last Incident
          <div className="h-3 w-3">
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="h-3 w-3" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </div>
        </button>
      ),
      cell: ({ row }) => {
        const monitor = row.original;
        const lastIncident = monitor.last_incident;

        if (!lastIncident) {
          return <span className="text-muted-foreground text-sm">None</span>;
        }

        return (
          <span
            className={cn(
              "text-xs font-medium",
              lastIncident.status === "ongoing"
                ? "text-orange-600"
                : lastIncident.status === "acknowledged"
                  ? "text-yellow-600"
                  : "text-green-600"
            )}
          >
            {lastIncident.status === "ongoing"
              ? "Ongoing"
              : lastIncident.status === "acknowledged"
                ? "Acknowledged"
                : "Mitigated"}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "last_check_at",
      header: ({ column }) => (
        <button
          type="button"
          className="group text-muted-foreground flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Last Check
          <div className="h-3 w-3">
            {column.getIsSorted() === "asc" && (
              <ChevronUpIcon className="h-3 w-3" />
            )}
            {column.getIsSorted() === "desc" && (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </div>
        </button>
      ),
      cell: ({ row }) => {
        const lastCheck = row.getValue("last_check_at") as string | null;
        return (
          <div className="text-sm">
            {lastCheck
              ? formatDistanceToNow(new Date(lastCheck), { addSuffix: true })
              : "Never"}
          </div>
        );
      },
      enableSorting: true,
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const monitor = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to="/dashboard/$workspaceName/monitors/$id"
                  params={{ id: monitor.id, workspaceName }}
                  search={{ days: 7 }}
                  className="w-full text-xs"
                >
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/dashboard/$workspaceName/monitors/$id/edit"
                  params={{ id: monitor.id, workspaceName }}
                  search={{ days: 7 }}
                  className="w-full text-xs"
                >
                  Configure
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="w-full text-xs">
                {monitor.status === "paused" ? "Resume" : "Pause"}
              </DropdownMenuItem>
              <DropdownMenuItem className="w-full text-xs text-red-500">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
