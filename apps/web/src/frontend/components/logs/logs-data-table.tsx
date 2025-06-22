import { Log } from "@/frontend/lib/types";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import * as React from "react";
import {
  cn,
  getRegionNameFromCode,
  getStatusColor,
  getStatusRowClass,
  getStatusTextColor,
} from "../../lib/utils";
import { Route } from "../../routes/dashboard/$workspaceName/logs";
import { LogsFiltersSidebar } from "./logs-data-table-filters-sidebar";
import LogsSheet from "./logs-sheet";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export const columns: ColumnDef<Log>[] = [
  {
    id: "status-indicator",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const status = row.original.status_code;
      return (
        <div className="flex items-center justify-center">
          <div
            className={cn("w-3 h-3", getStatusColor(status))}
            title={`Status: ${status}`}
          />
        </div>
      );
    },
    size: 20,
    minSize: 20,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-1 justify-start text-left font-medium -ml-1 h-auto py-1"
      >
        Timestamp
      </button>
    ),
    cell: ({ row }) => {
      const dateString = row.getValue("created_at") as string;
      try {
        const date = parseISO(dateString);
        return (
          <span className="whitespace-nowrap text-muted-foreground font-mono text-sm">
            {format(date, "LLL dd, y HH:mm:ss")}
          </span>
        );
      } catch {
        return (
          <div className="text-muted-foreground font-mono text-sm">
            Invalid Date
          </div>
        );
      }
    },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue?.from && !filterValue?.to) return true;

      const dateString = row.getValue(columnId) as string;
      const date = parseISO(dateString);

      if (filterValue.from && filterValue.to) {
        return date >= filterValue.from && date <= filterValue.to;
      } else if (filterValue.from) {
        return date >= filterValue.from;
      } else if (filterValue.to) {
        return date <= filterValue.to;
      }

      return true;
    },
    size: 220,
    minSize: 220,
    sortingFn: "datetime",
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("method") as string;
      const checkType = row.original.check_type;
      
      // Check if this is a TCP check
      const isTcpCheck = checkType === "tcp";
      
      return (
        <span className="text-sm font-mono font-medium">
          {isTcpCheck ? "TCP" : method}
        </span>
      );
    },
    size: 70,
    minSize: 60,
  },
  {
    accessorKey: "url",
    header: "URL Monitored",
    cell: ({ row }) => {
      const url = row.getValue("url") as string;
      const checkType = row.original.check_type;
      
      // Check if this is a TCP check
      const isTcpCheck = checkType === "tcp";
      
      return (
        <div className="flex items-center space-x-2">
          {isTcpCheck && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
              TCP
            </span>
          )}
          <span className="text-sm font-medium" title={url}>
            {url}
          </span>
        </div>
      );
    },
    size: 250,
  },
  {
    accessorKey: "status_code",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-1 justify-start text-left -ml-1 h-auto py-1"
      >
        Status
      </button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status_code") as number | null;
      return (
        <span className={cn("font-mono text-sm", getStatusTextColor(status))}>
          {status === null || status === -1 ? "ERR" : status}
        </span>
      );
    },
    enableResizing: false,
    size: 60,
    minSize: 60,
  },
  {
    accessorKey: "latency",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-1 justify-start text-left -ml-1 h-auto py-1"
      >
        Latency
      </button>
    ),
    cell: ({ row }) => {
      const latency = row.getValue("latency") as number;
      return typeof latency === "number" && latency >= 0 ? (
        <span className="font-mono text-sm">{`${latency.toFixed(0)}ms`}</span>
      ) : (
        <span className="text-muted-foreground text-sm font-mono">N/A</span>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue?.min && !filterValue?.max) return true;

      const latency = row.getValue(columnId) as number;

      if (typeof latency !== "number" || latency < 0) return false;

      if (filterValue.min !== undefined && filterValue.max !== undefined) {
        return latency >= filterValue.min && latency <= filterValue.max;
      } else if (filterValue.min !== undefined) {
        return latency >= filterValue.min;
      } else if (filterValue.max !== undefined) {
        return latency <= filterValue.max;
      }

      return true;
    },
    size: 80,
    minSize: 70,
  },
  {
    accessorKey: "region",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-1 justify-start text-left -ml-1 h-auto py-1"
      >
        Region
      </button>
    ),
    cell: ({ row }) => {
      const regionCode = row.getValue("region") as string;

      const region = getRegionNameFromCode(regionCode);

      return region ? (
        <span className="font-mono text-sm">{region}</span>
      ) : (
        <span className="text-muted-foreground text-sm font-mono">N/A</span>
      );
    },
    size: 70,
    minSize: 60,
  },
];

interface LogsDataTableProps {
  data: Log[];
}

export function LogsDataTable({ data }: LogsDataTableProps) {
  const navigate = Route.useNavigate();
  const { logId } = Route.useSearch();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      monitor_id: false,
    });

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="flex w-full flex-1 min-h-0">
      <LogsFiltersSidebar table={table} data={data} />{" "}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex-1 min-h-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className={cn(
                    "hover:bg-transparent",
                    "[&>*]:border-t-0 [&>*]:border-b",
                    "[&>:not(:last-child)]:border-r",
                    "border-border"
                  )}
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "px-2 py-1 h-auto relative select-none truncate text-sm font-medium",
                        "whitespace-nowrap text-muted-foreground",
                        "bg-background",
                        header.id === "status-indicator" && "w-6"
                      )}
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={
                      logId === row.original.id ? "selected" : undefined
                    }
                    className={cn(
                      "border-b cursor-pointer border-dashed transition-colors duration-100",
                      getStatusRowClass(row.original.status_code),
                      "data-[state=selected]:bg-blue-100 dark:data-[state=selected]:bg-blue-900/40",
                      "data-[state=selected]:hover:!bg-blue-200/80 dark:data-[state=selected]:hover:!bg-blue-800/60",
                      !getStatusRowClass(row.original.status_code) &&
                        "even:bg-slate-50/50 dark:even:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    )}
                    onClick={() => {
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          logId: row.original.id,
                        }),
                        replace: true,
                      });
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-2 py-1.5 whitespace-nowrap border-r last:border-r-0 border-border/50",
                          cell.column.id === "status-indicator" && "w-6 p-1"
                        )}
                        style={{ width: cell.column.getSize() }}
                      >
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
                    className="h-24 text-center text-muted-foreground"
                  >
                    No logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end p-2 border-t shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="space-x-2 ml-4">
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <LogsSheet table={table} />
    </div>
  );
}
