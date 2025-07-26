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
  TableRow,
} from "@/frontend/components/ui/table";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Monitor } from "@/frontend/types/types";
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
import { useEffect, useMemo, useState } from "react";
import { MonitorWithLastIncident } from "../../types";
import { columns } from "./columns";

export default function MonitorsTable({
  monitors,
  onSelectionChange,
}: {
  monitors: MonitorWithLastIncident[];
  onSelectionChange: (selectedMonitors: Monitor[]) => void;
}) {
  const navigate = Route.useNavigate();
  const { workspaceName } = Route.useParams();

  const [sorting, setSorting] = useState<ColumnSort[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  const selectedMonitors = useMemo(() => {
    return Object.keys(rowSelection).map(
      (rowIndex) => monitors[parseInt(rowIndex)]
    );
  }, [rowSelection, monitors]);

  useEffect(() => {
    onSelectionChange(selectedMonitors);
  }, [selectedMonitors, onSelectionChange]);

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

  const errorMonitors = monitors.filter(
    (m) => m.status === "error" || m.status === "broken"
  );
  const openIncidents = monitors.reduce((total, monitor) => {
    if (monitor.last_incident && monitor.last_incident.status === "ongoing") {
      return total + 1;
    }
    return total;
  }, 0);

  const handleRowClick = (monitor: Monitor) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id: monitor.id },
      search: { days: 7 },
    });
  };

  return (
    <div className="space-y-4">
      {(errorMonitors.length > 0 || openIncidents > 0) && (
        <div className="bg-muted/50 flex items-center gap-4 rounded-md px-3 py-3">
          {errorMonitors.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-xs bg-red-500"></div>
              <span className="text-xs font-medium">
                {errorMonitors.length} Monitor
                {errorMonitors.length === 1 ? "" : "s"} with errors
              </span>
            </div>
          )}
          {openIncidents > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-xs bg-orange-500"></div>
              <span className="text-xs font-medium">
                {openIncidents} Open incident{openIncidents === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search monitors..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="h-8 max-w-sm text-xs"
        />
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="!h-8 text-xs capitalize">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Status
            </SelectItem>
            {Array.from(new Set(monitors.map((m) => m.status))).map(
              (status) => (
                <SelectItem
                  key={status}
                  value={status}
                  className="text-xs capitalize"
                >
                  {status}
                </SelectItem>
              )
            )}
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
          <SelectTrigger className="!h-8 text-xs capitalize">
            <SelectValue className="uppercase" placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Types
            </SelectItem>
            {Array.from(
              new Set(
                table
                  .getFilteredRowModel()
                  .rows.map((row) => row.original.check_type)
              )
            ).map((type) => (
              <SelectItem key={type} value={type} className="text-xs uppercase">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Table>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  className={`cursor-pointer rounded-md border-b-0 ${
                    table.getFilteredSelectedRowModel().rows.length === 0 &&
                    index === 0
                      ? "bg-muted/50"
                      : ""
                  }`}
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("[data-checkbox]") ||
                      target.closest("[data-info-button]")
                    ) {
                      return;
                    }
                    handleRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={`${
                        index === 0
                          ? "w-8 rounded-l-md"
                          : index === 1
                            ? "w-8"
                            : index === 2
                              ? "flex-1"
                              : index === 3
                                ? "hidden"
                                : index === row.getVisibleCells().length - 1
                                  ? "w-20 rounded-r-md"
                                  : ""
                      }`}
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
                <TableCell colSpan={columns.length} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <div className="text-muted-foreground text-center text-xs">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} monitor(s) selected
        </div>
      )}
    </div>
  );
}
