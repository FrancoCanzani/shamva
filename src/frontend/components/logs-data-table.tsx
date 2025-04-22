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
import { CheckCircle, XCircle } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export const columns: ColumnDef<Log>[] = [
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
          <span className="whitespace-nowrap font-mono text-sm">
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
    sortingFn: "datetime",
    enableHiding: false,
    size: 180,
  },
  {
    accessorKey: "url",
    header: "URL Monitored",
    cell: ({ row }) => {
      const url = row.getValue("url") as string;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate block max-w-[300px]"
          title={url}
        >
          {url}
        </a>
      );
    },
    size: 320,
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

      return <span className="font-mono text-xs">{status}</span>;
    },
    size: 80,
  },
  {
    accessorKey: "ok",
    header: "OK",
    cell: ({ row }) => {
      const ok = row.getValue("ok") as boolean;
      return ok ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      );
    },
    size: 60,
  },
  {
    accessorKey: "latency",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-1 justify-start text-left -ml-1 h-auto py-1"
      >
        Latency (ms)
      </button>
    ),
    cell: ({ row }) => {
      const latency = row.getValue("latency") as number;
      return latency >= 0 ? (
        <span className="font-mono text-sm">{latency.toFixed(2)}</span>
      ) : (
        <span className="text-muted-foreground text-sm italic">N/A</span>
      );
    },
    size: 120,
  },
  {
    accessorKey: "monitor_id",
    header: "Monitor ID",
    cell: ({ row }) => (
      <span
        className="font-mono text-xs text-muted-foreground truncate block max-w-[100px]"
        title={row.getValue("monitor_id")}
      >
        {row.getValue("monitor_id")}
      </span>
    ),
    size: 120,
  },
  {
    accessorKey: "do_id",
    header: "DO ID",
    cell: ({ row }) => (
      <span
        className="font-mono text-xs text-muted-foreground truncate block max-w-[150px]"
        title={row.getValue("do_id")}
      >
        {row.getValue("do_id")}
      </span>
    ),
    size: 170,
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
    <div className="w-full">
      <div className="border-y overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-2 py-1.5 h-auto text-sm whitespace-nowrap border-r last:border-r-0 sticky top-0 bg-muted/95 backdrop-blur-sm"
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
                  className="border-b even:bg-muted/30 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-2 py-1.5 whitespace-nowrap border-r last:border-r-0"
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
                  className="h-24 text-center"
                >
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end p-4">
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
