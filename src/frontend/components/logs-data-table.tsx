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
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const getStatusColor = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "bg-gray-200 dark:bg-gray-700";
  }
  if (status >= 200 && status < 300) {
    return "bg-gray-200 dark:bg-gray-700";
  } else if (status >= 300 && status < 400) {
    return "bg-blue-200 dark:bg-blue-300";
  } else if (status >= 400 && status < 500) {
    return "bg-yellow-200 dark:bg-yellow-300";
  } else if (status >= 500) {
    return "bg-red-200 dark:bg-red-300";
  }
  return "bg-gray-200 dark:bg-gray-700";
};

const getStatusTextColor = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "text-gray-700 dark:text-gray-300";
  }
  if (status >= 200 && status < 300) {
    return "text-green-700 dark:text-green-200";
  } else if (status >= 300 && status < 400) {
    return "text-blue-700 dark:text-blue-200";
  } else if (status >= 400 && status < 500) {
    return "text-yellow-800 dark:text-yellow-200";
  } else if (status >= 500) {
    return "text-red-700 dark:text-red-200";
  }
  return "text-gray-700 dark:text-gray-300";
};

const getStatusRowClass = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "";
  }
  if (status >= 200 && status < 300) {
    return "";
  } else if (status >= 300 && status < 400) {
    return "bg-blue-50 dark:bg-blue-900/20 hover:!bg-blue-100/80 dark:hover:!bg-blue-800/40";
  } else if (status >= 400 && status < 500) {
    return "bg-yellow-50 dark:bg-yellow-900/20 hover:!bg-yellow-100/80 dark:hover:!bg-yellow-800/40";
  } else if (status >= 500) {
    return "bg-red-50 dark:bg-red-900/20 hover:!bg-red-100/80 dark:hover:!bg-red-800/40";
  }
  return "";
};

export const columns: ColumnDef<Log>[] = [
  {
    id: "status-indicator",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const status = row.original.status;
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
          <span className="whitespace-nowrap text-muted-foreground geist-mono text-sm">
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
    size: 200,
    minSize: 200,
    sortingFn: "datetime",
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("method") as string;
      return <span className="text-sm">{method}</span>;
    },
    size: 80,
  },
  {
    accessorKey: "url",
    header: "URL Monitored",
    cell: ({ row }) => {
      const url = row.getValue("url") as string;
      return (
        <span className="text-sm font-medium" title={url}>
          {url}
        </span>
      );
    },
    size: 250,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-1 justify-start text-left -ml-1 h-auto py-1"
      >
        Status
      </button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as number;
      return (
        <span
          className={cn(
            "geist-mono text-sm font-medium",
            getStatusTextColor(status),
          )}
        >
          {status}
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
      return latency >= 0 ? (
        <span className="geist-mono text-sm">{`${latency}ms`}</span>
      ) : (
        <span className="text-muted-foreground text-sm">N/A</span>
      );
    },
    size: 120,
  },
  {
    accessorKey: "colo",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-1 justify-start text-left -ml-1 h-auto py-1"
      >
        Region
      </button>
    ),
    cell: ({ row }) => {
      const colo = row.getValue("colo") as string;
      return colo ? (
        <span className="font-mono text-sm">{colo}</span>
      ) : (
        <span className="text-muted-foreground text-sm">N/A</span>
      );
    },
    size: 120,
  },
];

interface LogsDataTableProps {
  data: Log[];
}

export function LogsDataTable({ data }: LogsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ monitor_id: false, do_id: false });
  const [rowSelection, setRowSelection] = React.useState({});

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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="flex h-full min-h-screen w-full flex-col">
      <div className="z-0">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(
                  "hover:bg-transparent",
                  "[&>*]:border-t-0 [&>*]:border-b",
                  "[&>:not(:last-child)]:border-r",
                  "border-border",
                )}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "px-2 py-1.5 h-auto relative select-none truncate text-sm font-medium",
                      "whitespace-nowrap text-muted-foreground",
                      "bg-background",
                      // First header column for status indicator
                      header.id === "status-indicator" && "w-6",
                    )}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "border-b even:bg-slate-100 hover:bg-slate-200",
                    getStatusRowClass(row.original.status),
                    "data-[state=selected]:bg-primary/20 data-[state=selected]:hover:!bg-primary/30",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-2 py-1.5 whitespace-nowrap border-r last:border-r-0 border-border/50",
                        // Make status indicator cell smaller
                        cell.column.id === "status-indicator" && "w-6 p-1",
                      )}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
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
      <div className="flex items-center justify-end p-4 border-t">
        <div className="space-x-2">
          <Button
            variant={"outline"}
            size={"sm"}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant={"outline"}
            size={"sm"}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
