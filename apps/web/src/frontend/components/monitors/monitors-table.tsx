import { supabase } from "@/frontend/lib/supabase";
import type { Monitor } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { useMutation } from "@tanstack/react-query";
import { redirect, useRouter } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ColumnSort,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { showToastTimer } from "../ui/toast-timer";
import { createColumns } from "./columns";

export default function MonitorsTable({ monitors }: { monitors: Monitor[] }) {
  const navigate = Route.useNavigate();
  const router = useRouter();
  const { workspaceName } = Route.useParams();

  const [sorting, setSorting] = useState<ColumnSort[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteToastOpen, setIsDeleteToastOpen] = useState(false);

  const pauseOrResumeMutation = useMutation({
    mutationFn: async ({
      monitorId,
      status,
    }: {
      monitorId: string;
      status: "active" | "paused";
    }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw redirect({
          to: "/auth/login",
          search: { redirect: `/dashboard/${workspaceName}/monitors` },
          throw: true,
        });
      }
      const token = session.access_token;
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update monitor");
      }
      return response.json();
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Monitor updated successfully");
    },
    onError: () => {
      toast.error("Failed to update monitor");
    },
  });

  const deleteMonitorMutation = useMutation({
    mutationFn: async (monitorId: string) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw redirect({
          to: "/auth/login",
          search: { redirect: `/dashboard/${workspaceName}/monitors` },
          throw: true,
        });
      }
      const token = session.access_token;
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete monitor");
      }
      return response.json();
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Monitor deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete monitor");
    },
  });

  const handlePauseOrResume = (monitorId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "active" : "paused";
    pauseOrResumeMutation.mutate({
      monitorId,
      status: newStatus as "active" | "paused",
    });
  };

  const handleBulkPause = () => {
    const selectedRows = Object.keys(rowSelection);
    selectedRows.forEach((rowIndex) => {
      const monitor = monitors[parseInt(rowIndex)];
      if (monitor.status != "error") {
        handlePauseOrResume(monitor.id, monitor.status);
      }
    });
  };

  const handleBulkResume = () => {
    const selectedRows = Object.keys(rowSelection);
    selectedRows.forEach((rowIndex) => {
      const monitor = monitors[parseInt(rowIndex)];
      if (monitor.status === "paused") {
        handlePauseOrResume(monitor.id, monitor.status);
      }
    });
  };

  const handleBulkDelete = () => {
    const selectedRows = Object.keys(rowSelection);
    selectedRows.forEach((rowIndex) => {
      const monitor = monitors[parseInt(rowIndex)];
      deleteMonitorMutation.mutate(monitor.id);
    });
  };

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(monitors.map((m) => m.status)));
    return statuses;
  }, [monitors]);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(monitors.map((m) => m.check_type)));
    return types;
  }, [monitors]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const columns = createColumns(handleCheckboxClick);

  const table = useReactTable({
    data: monitors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableSorting: true,
    enableMultiSort: true,
    enableSortingRemoval: true,
    sortDescFirst: false,
  });

  const selectedCount = Object.keys(rowSelection).length;

  const errorMonitors = monitors.filter(
    (m) => m.status === "error" || m.status === "broken"
  );
  const openIncidents = monitors.reduce((total, monitor) => {
    const unresolvedIncidents = (monitor.incidents || []).filter(
      (incident) => !incident.resolved_at
    );
    return total + unresolvedIncidents.length;
  }, 0);

  const hasActiveFilters =
    globalFilter ||
    columnFilters.some((filter) => filter.value && filter.value !== "");

  const handleClearFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
  };

  const handleRowClick = (monitor: Monitor) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id: monitor.id },
      search: { days: 7 },
    });
  };

  return (
    <div className="relative space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search monitors..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="h-8 max-w-sm text-xs"
        />
        {sorting.length > 0 && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <span>Sorted by:</span>
            {sorting.map((sort, index) => (
              <span key={sort.id} className="font-medium">
                {sort.id}
                {sort.desc ? " ↓" : " ↑"}
                {index < sorting.length - 1 && ", "}
              </span>
            ))}
          </div>
        )}
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="!h-8 text-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Status
            </SelectItem>
            {statusOptions.map((status) => (
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
          value={
            (table.getColumn("check_type")?.getFilterValue() as string) ?? ""
          }
          onValueChange={(value) =>
            table
              .getColumn("check_type")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="!h-8 text-xs">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Types
            </SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type} className="text-xs uppercase">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground text-xs"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        )}
        {sorting.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground text-xs"
            onClick={() => table.resetSorting()}
          >
            Clear Sorting
          </Button>
        )}
      </div>

      <div className="ring-carbon-50 dark:ring-carbon-800 bg-carbon-50/40 rounded px-1 pb-1">
        {(errorMonitors.length > 0 || openIncidents > 0) && (
          <div className="flex items-center gap-4 p-3">
            {errorMonitors.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">
                  {errorMonitors.length} Monitor
                  {errorMonitors.length === 1 ? "" : "s"} with errors
                </span>
              </div>
            )}
            {openIncidents > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <span className="text-sm font-medium">
                  {openIncidents} Open incident{openIncidents === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="bg-background ring-carbon-50 dark:ring-carbon-800 rounded shadow-xs ring-1 ring-inset">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="bg-background/80 absolute -bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded border p-2 shadow backdrop-blur-sm">
          <Button
            variant="outline"
            size="xs"
            onClick={handleBulkPause}
            disabled={
              !Object.keys(rowSelection).some(
                (rowIndex) => monitors[parseInt(rowIndex)].status !== "paused"
              )
            }
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={handleBulkResume}
            disabled={
              !Object.keys(rowSelection).some(
                (rowIndex) => monitors[parseInt(rowIndex)].status === "paused"
              )
            }
          >
            Resume
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => {
              if (isDeleteToastOpen) return; // Prevent multiple toasts
              setIsDeleteToastOpen(true);
              showToastTimer({
                title: "Delete Selected Monitors",
                description: `Are you sure you want to delete ${selectedCount} monitor(s)? This action cannot be undone.`,
                confirmText: "Delete",
                cancelText: "Cancel",
                variant: "destructive",
                onConfirm: () => {
                  handleBulkDelete();
                  setIsDeleteToastOpen(false);
                },
                duration: 5000,
              });
            }}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
