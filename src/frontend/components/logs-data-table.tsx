import { useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import * as React from "react";

import { Log } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/logs/index";
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
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
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
    return "bg-blue-200 dark:bg-blue-700";
  } else if (status >= 400 && status < 500) {
    return "bg-yellow-200 dark:bg-yellow-700";
  } else if (status >= 500 || status < 0) {
    return "bg-red-200 dark:bg-red-700";
  }
  return "bg-gray-200 dark:bg-gray-700";
};

const getStatusTextColor = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "text-gray-700 dark:text-gray-300";
  }
  if (status >= 200 && status < 300) {
    return "text-green-700 dark:text-green-300";
  } else if (status >= 300 && status < 400) {
    return "text-blue-700 dark:text-blue-300";
  } else if (status >= 400 && status < 500) {
    return "text-yellow-800 dark:text-yellow-300";
  } else if (status >= 500 || status < 0) {
    return "text-red-700 dark:text-red-300";
  }
  return "text-gray-700 dark:text-gray-300";
};

const getStatusRowClass = (status: number | unknown): string => {
  if (typeof status !== "number") {
    return "";
  }
  if (status >= 200 && status < 300) {
    return "hover:bg-slate-100 dark:hover:bg-slate-800/50";
  } else if (status >= 300 && status < 400) {
    return "bg-blue-50 dark:bg-blue-900/20 hover:!bg-blue-100/80 dark:hover:!bg-blue-800/40";
  } else if (status >= 400 && status < 500) {
    return "bg-yellow-50 dark:bg-yellow-900/20 hover:!bg-yellow-100/80 dark:hover:!bg-yellow-800/40";
  } else if (status >= 500 || status < 0) {
    return "bg-red-50 dark:bg-red-900/20 hover:!bg-red-100/80 dark:hover:!bg-red-800/40";
  }
  return "hover:bg-slate-100 dark:hover:bg-slate-800/50";
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
    size: 220,
    minSize: 220,
    sortingFn: "datetime",
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("method") as string;
      return <span className="text-sm font-mono">{method}</span>;
    },
    size: 70,
    minSize: 60,
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
          {status === -1 ? "ERR" : status}
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
        <span className="geist-mono text-sm">{`${latency.toFixed(0)}ms`}</span>
      ) : (
        <span className="text-muted-foreground text-sm geist-mono">N/A</span>
      );
    },
    size: 80,
    minSize: 70,
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
        <span className="text-muted-foreground text-sm geist-mono">N/A</span>
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
  const navigate = useNavigate();
  const { logId } = Route.useSearch();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ monitor_id: false, do_id: false });

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

  const sortedFilteredRows = table.getRowModel().rows;

  const selectedLogIndex = React.useMemo(() => {
    if (!logId) return -1;
    return sortedFilteredRows.findIndex((row) => row.original.id === logId);
  }, [logId, sortedFilteredRows]);

  const selectedLog = React.useMemo(() => {
    if (selectedLogIndex === -1) return null;
    return sortedFilteredRows[selectedLogIndex]?.original;
  }, [selectedLogIndex, sortedFilteredRows]);

  const handleCloseSheet = () => {
    navigate({
      search: (prev) => {
        const { logId: _, ...rest } = prev;
        return rest;
      },
      replace: true,
    });
  };

  const canGoPrevious = selectedLogIndex > 0;
  const canGoNext =
    selectedLogIndex !== -1 && selectedLogIndex < sortedFilteredRows.length - 1;

  const goToPrevious = () => {
    if (canGoPrevious) {
      const previousLogId =
        sortedFilteredRows[selectedLogIndex - 1].original.id;
      navigate({
        search: (prev) => ({ ...prev, logId: previousLogId }),
        replace: true,
      });
    }
  };

  const goToNext = () => {
    if (canGoNext) {
      const nextLogId = sortedFilteredRows[selectedLogIndex + 1].original.id;
      navigate({
        search: (prev) => ({ ...prev, logId: nextLogId }),
        replace: true,
      });
    }
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col relative">
      <div className="z-0 flex-grow overflow-auto">
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
                  data-state={
                    logId === row.original.id ? "selected" : undefined
                  }
                  className={cn(
                    "border-b cursor-pointer transition-colors duration-100",
                    getStatusRowClass(row.original.status),
                    "data-[state=selected]:bg-blue-100 dark:data-[state=selected]:bg-blue-900/40",
                    "data-[state=selected]:hover:!bg-blue-200/80 dark:data-[state=selected]:hover:!bg-blue-800/60",
                    !getStatusRowClass(row.original.status) &&
                      "even:bg-slate-50/50 dark:even:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                  )}
                  onClick={() => {
                    navigate({
                      search: (prev) => ({ ...prev, logId: row.original.id }),
                      replace: true,
                    });
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-2 py-1.5 whitespace-nowrap border-r last:border-r-0 border-border/50",
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
      <div className="flex items-center justify-end p-4 border-t sticky bottom-0 bg-background z-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="space-x-2 ml-4">
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

      <Sheet
        open={!!logId && selectedLogIndex !== -1}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseSheet();
        }}
      >
        <SheetContent className="w-full sm:max-w-xl flex flex-col">
          {selectedLog ? (
            <>
              <SheetHeader className="flex-shrink-0 flex items-start justify-between w-full flex-row pr-10">
                <div className="">
                  <SheetTitle>Log Details</SheetTitle>
                  <SheetDescription className="geist-mono text-xs break-all">
                    {selectedLog.url}
                  </SheetDescription>
                </div>

                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size={"xs"}
                    className="text-xs rounded-xs"
                    onClick={goToPrevious}
                    disabled={!canGoPrevious}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    variant="outline"
                    size={"xs"}
                    className="text-xs rounded-xs"
                    onClick={goToNext}
                    disabled={!canGoNext}
                  >
                    <ChevronDown />
                  </Button>
                </div>
              </SheetHeader>
              <div className="p-4 space-y-4 overflow-y-auto flex-grow">
                <div className="divide-y divide-dashed space-y-1 text-sm">
                  <div className="flex items-center justify-between py-2">
                    <strong>Timestamp</strong>
                    <time>
                      {format(
                        parseISO(selectedLog.created_at),
                        "LLL dd, y HH:mm:ss",
                      )}
                    </time>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <strong>Method</strong>
                    <span className="geist-mono">{selectedLog.method}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <strong>Status</strong>
                    <span
                      className={cn(
                        "geist-mono font-medium",
                        getStatusTextColor(selectedLog.status),
                      )}
                    >
                      {selectedLog.status === -1 ? "ERR" : selectedLog.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <strong>Latency</strong>
                    <span className="geist-mono">
                      {selectedLog.latency >= 0
                        ? `${selectedLog.latency.toFixed(0)}ms`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <strong>Region</strong>
                    <span className="geist-mono">
                      {selectedLog.colo || "N/A"}
                    </span>
                  </div>
                </div>

                {selectedLog.error && (
                  <div className="text-sm">
                    <p>
                      <strong>Error:</strong>
                    </p>{" "}
                    <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-2 rounded overflow-auto max-h-48 text-red-700 dark:text-red-300">
                      {selectedLog.error}
                    </pre>
                  </div>
                )}

                <div>
                  <strong className="text-sm">Headers</strong>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48 geist-mono">
                    {JSON.stringify(selectedLog.headers, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong className="text-sm">Body Content</strong>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-96 geist-mono">
                    {(() => {
                      try {
                        if (
                          selectedLog.body_content &&
                          typeof selectedLog.body_content === "object" &&
                          "_rawContent" in selectedLog.body_content
                        ) {
                          return selectedLog.body_content._rawContent;
                        }
                        if (
                          selectedLog.body_content &&
                          typeof selectedLog.body_content === "object"
                        ) {
                          return JSON.stringify(
                            selectedLog.body_content,
                            null,
                            2,
                          );
                        }
                        return String(selectedLog.body_content ?? "N/A");
                      } catch {
                        return String(selectedLog.body_content ?? "N/A");
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {logId ? "Log not found in current view." : "No log selected."}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
