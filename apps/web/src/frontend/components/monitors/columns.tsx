import type { Monitor } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "../ui/checkbox";
import { StatusDot } from "../ui/status-dot";

export function createColumns(
  handleCheckboxClick?: (e: React.MouseEvent) => void
): ColumnDef<Monitor>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div onClick={handleCheckboxClick}>
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div onClick={handleCheckboxClick}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          type="button"
          className="group flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Name
          {column.getIsSorted() === "asc" && (
            <ArrowUpIcon className="h-3 w-3" />
          )}
          {column.getIsSorted() === "desc" && (
            <ArrowDownIcon className="h-3 w-3" />
          )}
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
          className="group flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Status
          {column.getIsSorted() === "asc" && (
            <ArrowUpIcon className="h-3 w-3" />
          )}
          {column.getIsSorted() === "desc" && (
            <ArrowDownIcon className="h-3 w-3" />
          )}
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
      accessorKey: "last_check_at",
      header: ({ column }) => (
        <button
          type="button"
          className="group flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Last Check
          {column.getIsSorted() === "asc" && (
            <ArrowUpIcon className="h-3 w-3" />
          )}
          {column.getIsSorted() === "desc" && (
            <ArrowDownIcon className="h-3 w-3" />
          )}
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
      accessorKey: "check_type",
      header: ({ column }) => (
        <button
          type="button"
          className="group flex items-center gap-1"
          onClick={() => column.toggleSorting()}
        >
          Type
          {column.getIsSorted() === "asc" && (
            <ArrowUpIcon className="h-3 w-3" />
          )}
          {column.getIsSorted() === "desc" && (
            <ArrowDownIcon className="h-3 w-3" />
          )}
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
  ];
}
