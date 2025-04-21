import { LinkAnalytic } from "@/frontend/lib/types";
import { getDeviceFromUserAgent } from "@/frontend/lib/utils";
import { Link } from "@tanstack/react-router";
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
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export const columns: ColumnDef<LinkAnalytic>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 justify-start text-left font-medium -ml-1 h-auto py-1"
        >
          Timestamp
        </button>
      );
    },
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
    size: 150,
  },
  {
    accessorKey: "slug",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 justify-start text-left -ml-1 h-auto py-1"
        >
          Slug
        </button>
      );
    },
    cell: ({ row }) => {
      const slug = row.getValue("slug") as string;
      return (
        <Link
          to="/dashboard/links/$slug"
          params={{ slug }}
          className="text-primary hover:underline"
        >
          <span className="truncate">{slug}</span>
        </Link>
      );
    },
    enableHiding: false,
    size: 120,
  },
  {
    accessorKey: "links.url",
    header: "Destination URL",
    cell: ({ row }) => {
      const url = row.original.links?.url;
      if (!url)
        return <span className="text-muted-foreground text-sm">N/A</span>;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate block max-w-[200px]"
          title={url}
        >
          {url}
        </a>
      );
    },
    enableSorting: false,
    size: 220,
  },
  {
    id: "location",
    header: "Location",
    accessorFn: (row) =>
      `${row.city ?? ""}, ${row.country_code ?? ""}, ${row.continent_code ?? ""}`,
    cell: ({ row }) => {
      const city = row.original.city;
      const country = row.original.country_code;
      const continent = row.original.continent_code;
      const displayLocation = [city, country, continent]
        .filter(Boolean)
        .join(", ");
      return (
        <span
          className="truncate text-sm block max-w-[180px]"
          title={displayLocation || "Unknown Location"}
        >
          {displayLocation || (
            <span className="text-muted-foreground text-sm italic">
              Unknown
            </span>
          )}
        </span>
      );
    },
    size: 200,
  },
  {
    accessorKey: "referer",
    header: "Referrer",
    cell: ({ row }) => {
      const referrer = row.getValue("referer") as string | null;
      if (!referrer) {
        return (
          <span className="text-muted-foreground text-sm italic">Direct</span>
        );
      }
      try {
        const url = new URL(referrer);
        return (
          <span
            className="text-sm truncate block max-w-[150px]"
            title={referrer}
          >
            {url.hostname}
          </span>
        );
      } catch {
        return (
          <span
            className="text-sm truncate block max-w-[150px]"
            title={referrer}
          >
            {referrer}
          </span>
        );
      }
    },
    size: 170,
  },
  {
    id: "device",
    header: "Device",
    accessorFn: (row) => getDeviceFromUserAgent(row.user_agent),
    cell: ({ row }) => {
      const deviceType = getDeviceFromUserAgent(row.original.user_agent);
      return <span className="truncate text-sm">{deviceType}</span>;
    },
    enableSorting: true,
    filterFn: "equalsString",
    size: 100,
  },
];

interface AnalyticsDataTableProps {
  data: LinkAnalytic[];
}

export function AnalyticsDataTable({ data }: AnalyticsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ user_agent: false });
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
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
      <div className="flex items-center p-4 gap-2 flex-wrap">
        <Input
          placeholder="Filter slugs..."
          value={(table.getColumn("slug")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("slug")?.setFilterValue(event.target.value)
          }
          className="max-w-xs h-8"
        />
        <Input
          placeholder="Filter destinations..."
          value={
            (table.getColumn("links.url")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("links.url")?.setFilterValue(event.target.value)
          }
          className="max-w-xs h-8"
        />
        <Input
          placeholder="Filter referrers..."
          value={(table.getColumn("referer")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("referer")?.setFilterValue(event.target.value)
          }
          className="max-w-xs h-8"
        />
        <Input
          placeholder="Filter locations..."
          value={
            (table.getColumn("location")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("location")?.setFilterValue(event.target.value)
          }
          className="max-w-xs h-8"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-8">
              Columns <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                let headerText = column.id;
                if (typeof column.columnDef.header === "string") {
                  headerText = column.columnDef.header;
                }
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {headerText.replace(/_/g, " ").replace(/\./g, " ")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="border-y overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={`px-2 py-1 h-auto text-sm whitespace-nowrap border-b border-r`}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                  className="border-b even:bg-orange-50 even:hover:bg-orange-50/50"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell
                        key={cell.id}
                        className={`px-2 py-1 whitespace-nowrap border-r`}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center border-l border-r"
                >
                  No analytics data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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
