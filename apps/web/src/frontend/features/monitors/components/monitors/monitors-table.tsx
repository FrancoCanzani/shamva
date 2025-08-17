import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { cn, getMonitorStatusTextColor } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDeleteMonitor, usePauseResumeMonitor } from "../../api/mutations";
import { MonitorWithMetrics } from "../../types";

const columnHelper = createColumnHelper<MonitorWithMetrics>();

export default function MonitorsTable({
  monitors,
  onSelectionChange,
}: {
  monitors: MonitorWithMetrics[];
  onSelectionChange: (selectedMonitors: MonitorWithMetrics[]) => void;
}) {
  const { workspaceName } = Route.useParams();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate({ from: "/dashboard/$workspaceName/monitors" });
  const router = useRouter();
  const deleteMonitorMutation = useDeleteMonitor();
  const pauseResumeMutation = usePauseResumeMonitor();

  const filteredMonitors = useMemo(() => {
    return monitors.filter((monitor) => {
      const matchesGlobal =
        !globalFilter ||
        monitor.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        monitor.url?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        monitor.tcp_host_port
          ?.toLowerCase()
          .includes(globalFilter.toLowerCase());

      const matchesStatus = !statusFilter || monitor.status === statusFilter;
      const matchesType = !typeFilter || monitor.check_type === typeFilter;

      return matchesGlobal && matchesStatus && matchesType;
    });
  }, [monitors, globalFilter, statusFilter, typeFilter]);

  const filterOptions = useMemo(
    () => ({
      statuses: Array.from(new Set(monitors.map((m) => m.status))),
      types: Array.from(new Set(monitors.map((m) => m.check_type))),
    }),
    [monitors]
  );

  const handleRowClick = (monitor: MonitorWithMetrics) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      search: { days: 7 },
      params: { id: monitor.id, workspaceName: workspaceName },
    });
  };

  const handleMouseEnter = async (monitor: MonitorWithMetrics) => {
    await router.preloadRoute({
      to: "/dashboard/$workspaceName/monitors/$id",
      search: { days: 7 },
      params: { id: monitor.id, workspaceName: workspaceName },
    });
  };

  const columns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select monitor"
        />
      ),
      enableSorting: false,
      size: 40,
    }),
    columnHelper.accessor("check_type", {
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Type
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs uppercase">{getValue()}</span>
      ),
      size: 60,
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Status
        </button>
      ),
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span
            className={cn(
              "text-sm capitalize",
              getMonitorStatusTextColor(getValue())
            )}
          >
            {status}
          </span>
        );
      },
      size: 80,
    }),
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Name
        </button>
      ),
      cell: ({ row, getValue }) => {
        const monitor = row.original;
        return (
          <Tooltip>
            <TooltipTrigger>
              <button
                className="text-left text-sm font-medium underline decoration-dotted underline-offset-1 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowClick(monitor);
                }}
              >
                {getValue()}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="">
                {monitor.check_type === "tcp"
                  ? monitor.tcp_host_port
                  : monitor.url}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      },
      minSize: 200,
    }),
    columnHelper.accessor((row) => row.uptime_percentage, {
      id: "uptime_percentage",
      header: ({ column }) => (
        <Tooltip>
          <TooltipTrigger>
            <button
              className="text-left underline decoration-dotted underline-offset-1"
              onClick={column.getToggleSortingHandler()}
            >
              Uptime
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p>Uptime over the last 14 days</p>
              <p className="mt-1">
                Formula: (successful_checks / total_checks) × 100
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ),
      cell: ({ getValue }) => {
        const uptime = getValue();
        if (uptime === null)
          return <span className="text-muted-foreground text-sm">-</span>;

        const getUptimeColor = (percentage: number) => {
          if (percentage >= 99) return "text-[var(--color-ok)]";
          if (percentage >= 95) return "text-[var(--color-degraded)]";
          return "text-[var(--color-error)]";
        };

        return (
          <span className={cn("font-mono text-sm", getUptimeColor(uptime))}>
            {uptime}%
          </span>
        );
      },
      size: 80,
    }),
    columnHelper.accessor(
      (row) => {
        const lastIncident = row.last_incident;
        if (!lastIncident) return null;
        return new Date(lastIncident.created_at).getTime();
      },
      {
        id: "lastIncident",
        header: ({ column }) => (
          <button
            className="text-left"
            onClick={column.getToggleSortingHandler()}
          >
            Last Incident
          </button>
        ),
        cell: ({ row }) => {
          const lastIncident = row.original.last_incident;

          if (!lastIncident) {
            return <span className="text-muted-foreground text-sm">-</span>;
          }

          const date = new Date(lastIncident.created_at);

          return (
            <button
              className="group flex items-center gap-1.5 text-left text-sm hover:text-blue-600 dark:hover:text-blue-400"
              onClick={(e) => {
                e.stopPropagation();
                navigate({
                  to: "/dashboard/$workspaceName/incidents/$id",
                  params: { workspaceName, id: lastIncident.id },
                });
              }}
            >
              <span className="font-mono text-sm tracking-tighter">
                {date.toLocaleDateString()}
              </span>
              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        },
        sortUndefined: "last",
        size: 120,
      }
    ),
    columnHelper.accessor("avg_latency", {
      header: ({ column }) => (
        <Tooltip>
          <TooltipTrigger>
            <button
              className="text-left underline decoration-dotted underline-offset-1"
              onClick={column.getToggleSortingHandler()}
            >
              Avg Latency
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p>Average latency over the last 14 days</p>
              <p className="mt-1">
                Formula: sum(all_latencies) / total_successful_checks
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ),
      cell: ({ getValue }) => {
        const latency = getValue();
        if (latency === null)
          return <span className="text-muted-foreground text-sm">-</span>;

        const getLatencyColor = (ms: number) => {
          if (ms <= 200) return "text-[var(--color-ok)]";
          if (ms <= 500) return "text-[var(--color-degraded)]";
          return "text-[var(--color-error)]";
        };

        return (
          <span className={cn("font-mono text-sm", getLatencyColor(latency))}>
            {latency}ms
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const monitor = row.original;

        const handleEdit = (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate({
            to: "/dashboard/$workspaceName/monitors/$id/edit",
            params: { workspaceName, id: monitor.id },
            search: { days: 7 },
          });
        };

        const handlePauseResume = (e: React.MouseEvent) => {
          e.stopPropagation();
          const newStatus = monitor.status === "paused" ? "active" : "paused";
          pauseResumeMutation.mutate({
            monitorId: monitor.id,
            status: newStatus,
          });
        };

        const handleDelete = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (confirm(`Are you sure you want to delete "${monitor.name}"?`)) {
            deleteMonitorMutation.mutate(monitor.id);
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                className="h-6"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={handlePauseResume}>
                {monitor.status === "paused" ? "Resume" : "Pause"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} variant="destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      size: 60,
    }),
  ];

  const table = useReactTable({
    data: filteredMonitors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    getRowId: (row) => row.id,
    state: {
      sorting,
      rowSelection,
    },
  });

  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedMonitors = selectedRows.map((row) => row.original);
    onSelectionChange(selectedMonitors);
  }, [rowSelection]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search monitors..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 max-w-sm text-xs"
        />
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) =>
            setStatusFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="!h-8 text-xs capitalize">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Status
            </SelectItem>
            {filterOptions.statuses.map((status) => (
              <SelectItem
                key={status}
                value={status}
                className="text-xs capitalize"
              >
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter || "all"}
          onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}
        >
          <SelectTrigger className="!h-8 text-xs capitalize">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Types
            </SelectItem>
            {filterOptions.types.map((type) => (
              <SelectItem key={type} value={type} className="text-xs uppercase">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const monitor = row.original;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className={cn(
                      "hover:bg-input/20 cursor-pointer",
                      row.getIsSelected() && "bg-input/20"
                    )}
                    onMouseEnter={() => handleMouseEnter(monitor)}
                    onClick={() => handleRowClick(monitor)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-muted-foreground rounded-md border border-dashed py-4 text-sm">
                    No results.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="text-muted-foreground text-center text-xs">
          {table.getSelectedRowModel().rows.length} of {filteredMonitors.length}{" "}
          monitor(s) selected
        </div>
      )}
    </div>
  );
}
