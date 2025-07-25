import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { StatusDot } from "@/frontend/components/ui/status-dot";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { Monitor } from "@/frontend/types/types";
import { cn } from "@/frontend/utils/utils";
import { ChevronRightIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNowStrict } from "date-fns";

export const columns: ColumnDef<Monitor>[] = [
  {
    id: "select",
    header: () => <span className="sr-only">Select</span>,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        data-checkbox
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 30,
    maxSize: 30,
    minSize: 30,
  },
  {
    id: "status",
    accessorKey: "status",
    header: () => <span className="sr-only">Status</span>,
    cell: ({ row }) => {
      const monitor = row.original;
      return (
        <div className="flex items-center justify-center">
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
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 30,
    maxSize: 30,
    minSize: 30,
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
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const monitor = row.original;
      return (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="xs" data-info-button>
                  <InfoCircledIcon className="text-muted-foreground h-3 w-3" />
                  <span className="sr-only">Monitor info</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="w-80 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StatusDot
                      pulse
                      color={
                        monitor.status === "active"
                          ? "bg-green-600"
                          : monitor.status === "error" ||
                              monitor.status === "broken"
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
                    <span className="font-medium">{monitor.name}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium uppercase">
                        {monitor.check_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 font-medium capitalize">
                        {monitor.status}
                      </span>
                    </div>
                    {monitor.last_check_at && (
                      <div>
                        <span className="text-muted-foreground">
                          Last check:
                        </span>
                        <span className="ml-2">
                          {formatDistanceToNowStrict(
                            new Date(monitor.last_check_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                      </div>
                    )}
                    {monitor.last_incident && (
                      <div>
                        <span className="text-muted-foreground">
                          Last incident:
                        </span>
                        <span
                          className={cn(
                            "ml-2 font-medium",
                            monitor.last_incident.status === "ongoing"
                              ? "text-red-600"
                              : monitor.last_incident.status === "acknowledged"
                                ? "text-yellow-600"
                                : "text-green-600"
                          )}
                        >
                          {monitor.last_incident.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChevronRightIcon className="text-muted-foreground h-3 w-3" />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
];
