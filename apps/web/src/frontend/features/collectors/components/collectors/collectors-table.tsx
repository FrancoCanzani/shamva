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
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/collectors";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { CollectorWithMetrics } from "../../types";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const columnHelper = createColumnHelper<CollectorWithMetrics>();

export default function CollectorsTable({
  collectors,
  onSelectionChange,
}: {
  collectors: CollectorWithMetrics[];
  onSelectionChange: (selectedCollectors: CollectorWithMetrics[]) => void;
}) {
  const { workspaceName } = Route.useParams();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate({
    from: "/dashboard/$workspaceName/collectors",
  });
  const router = useRouter();

  const filteredCollectors = useMemo(() => {
    return collectors.filter((collector) => {
      const matchesGlobal =
        !globalFilter ||
        collector.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        collector.last_metric?.hostname
          ?.toLowerCase()
          .includes(globalFilter.toLowerCase());

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && collector.is_active) ||
        (statusFilter === "inactive" && !collector.is_active);

      return matchesGlobal && matchesStatus;
    });
  }, [collectors, globalFilter, statusFilter]);

  const filterOptions = useMemo(
    () => ({
      statuses: ["active", "inactive"],
    }),
    []
  );

  const handleRowClick = (collector: CollectorWithMetrics) => {
    navigate({
      to: "/dashboard/$workspaceName/collectors/$id",
      params: { id: collector.id, workspaceName: workspaceName },
    });
  };

  const handleMouseEnter = async (collector: CollectorWithMetrics) => {
    await router.preloadRoute({
      to: "/dashboard/$workspaceName/collectors/$id",
      params: { id: collector.id, workspaceName: workspaceName },
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
          aria-label="Select collector"
        />
      ),
      enableSorting: false,
      size: 40,
    }),
    columnHelper.accessor("is_active", {
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Status
        </button>
      ),
      cell: ({ getValue }) => {
        const isActive = getValue();
        return (
          <span
            className={cn(
              "text-sm capitalize",
              isActive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {isActive ? "active" : "inactive"}
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
        const collector = row.original;
        return (
          <Tooltip>
            <TooltipTrigger>
              <button
                className="text-left text-sm font-medium underline decoration-dotted underline-offset-1 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowClick(collector);
                }}
              >
                {getValue()}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="">
                {collector.last_metric?.hostname || "No hostname"}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      },
      minSize: 200,
    }),
    columnHelper.accessor((row) => row.last_metric?.hostname, {
      id: "hostname",
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Hostname
        </button>
      ),
      cell: ({ getValue }) => {
        const hostname = getValue();
        if (!hostname) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return <span className="font-mono text-sm">{hostname}</span>;
      },
      size: 150,
    }),
    columnHelper.accessor((row) => row.last_metric?.platform, {
      id: "platform",
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Platform
        </button>
      ),
      cell: ({ getValue }) => {
        const platform = getValue();
        if (!platform) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return <span className="text-sm capitalize">{platform}</span>;
      },
      size: 100,
    }),
    columnHelper.accessor((row) => row.last_metric?.cpu_percent, {
      id: "cpu_percent",
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          CPU
        </button>
      ),
      cell: ({ getValue }) => {
        const cpuPercent = getValue();
        if (cpuPercent === null || cpuPercent === undefined) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        const getCpuColor = (percent: number) => {
          if (percent <= 50) return "text-green-600 dark:text-green-400";
          if (percent <= 80) return "text-yellow-600 dark:text-yellow-400";
          return "text-red-600 dark:text-red-400";
        };

        return (
          <span className={cn("font-mono text-sm", getCpuColor(cpuPercent))}>
            {cpuPercent.toFixed(1)}%
          </span>
        );
      },
      size: 80,
    }),
    columnHelper.accessor((row) => row.last_metric?.memory_percent, {
      id: "memory_percent",
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Memory
        </button>
      ),
      cell: ({ getValue }) => {
        const memoryPercent = getValue();
        if (memoryPercent === null || memoryPercent === undefined) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        const getMemoryColor = (percent: number) => {
          if (percent <= 70) return "text-green-600 dark:text-green-400";
          if (percent <= 90) return "text-yellow-600 dark:text-yellow-400";
          return "text-red-600 dark:text-red-400";
        };

        return (
          <span
            className={cn("font-mono text-sm", getMemoryColor(memoryPercent))}
          >
            {memoryPercent.toFixed(1)}%
          </span>
        );
      },
      size: 80,
    }),
    columnHelper.accessor((row) => row.last_metric?.created_at, {
      id: "last_seen",
      header: ({ column }) => (
        <button
          className="text-left"
          onClick={column.getToggleSortingHandler()}
        >
          Last Seen
        </button>
      ),
      cell: ({ getValue }) => {
        const lastSeen = getValue();
        if (!lastSeen) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        const date = new Date(lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        let timeAgo: string;
        if (diffMinutes < 1) {
          timeAgo = "Just now";
        } else if (diffMinutes < 60) {
          timeAgo = `${diffMinutes}m ago`;
        } else if (diffMinutes < 1440) {
          const hours = Math.floor(diffMinutes / 60);
          timeAgo = `${hours}h ago`;
        } else {
          const days = Math.floor(diffMinutes / 1440);
          timeAgo = `${days}d ago`;
        }

        const getTimeColor = (minutes: number) => {
          if (minutes <= 5) return "text-green-600 dark:text-green-400";
          if (minutes <= 30) return "text-yellow-600 dark:text-yellow-400";
          return "text-red-600 dark:text-red-400";
        };

        return (
          <span className={cn("text-sm", getTimeColor(diffMinutes))}>
            {timeAgo}
          </span>
        );
      },
      sortUndefined: "last",
      size: 100,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const collector = row.original;

        const handleEdit = (e: React.MouseEvent) => {
          e.stopPropagation();
          navigate({
            to: "/dashboard/$workspaceName/collectors/$id/edit",
            params: { workspaceName, id: collector.id },
          });
        };

        const handleDelete = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (confirm(`Are you sure you want to delete "${collector.name}"?`)) {
            // TODO: Implement delete mutation
            console.log("Delete collector:", collector.id);
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
    data: filteredCollectors,
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
    const selectedCollectors = selectedRows.map((row) => row.original);
    onSelectionChange(selectedCollectors);
  }, [rowSelection]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search collectors..."
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
                const collector = row.original;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className={cn(
                      "hover:bg-input/20 cursor-pointer",
                      row.getIsSelected() && "bg-input/20"
                    )}
                    onMouseEnter={() => handleMouseEnter(collector)}
                    onClick={() => handleRowClick(collector)}
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
          {table.getSelectedRowModel().rows.length} of{" "}
          {filteredCollectors.length} collector(s) selected
        </div>
      )}
    </div>
  );
}
