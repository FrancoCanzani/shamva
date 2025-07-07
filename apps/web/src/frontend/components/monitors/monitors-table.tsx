import type { Monitor } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import {
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { monitorsTableColumns } from "./monitors-table-columns";

export function MonitorsTable({ monitors }: { monitors: Monitor[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { workspaceName } = Route.useParams();

  const table = useReactTable({
    data: monitors,
    columns: monitorsTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { sorting },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xs border shadow-xs">
      <Table>
        <TableHeader className="bg-background sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "text-muted-foreground group cursor-pointer text-xs font-medium select-none",
                      header.column.getCanSort() && "hover:underline"
                    )}
                    style={{ width: header.getSize() }}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="invisible transition-opacity group-hover:visible">
                          {isSorted === "asc" && (
                            <ChevronUp size={14} className="inline" />
                          )}
                          {isSorted === "desc" && (
                            <ChevronDown size={14} className="inline" />
                          )}
                          {!isSorted && (
                            <ChevronUp
                              size={14}
                              className="inline opacity-30"
                            />
                          )}
                        </span>
                      )}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-carbon-50 cursor-pointer transition-colors"
                onClick={() => {
                  window.location.href = `/dashboard/${workspaceName}/monitors/${row.original.id}`;
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={monitorsTableColumns.length}
                className="text-muted-foreground h-24 text-center"
              >
                No monitors found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
