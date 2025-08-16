import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Incident } from "@/frontend/lib/types";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";

const columns: ColumnDef<Partial<Incident>>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const resolvedAt = row.getValue("resolved_at") as string | null;
      const isResolved = resolvedAt !== null;

      return (
        <div
          className={`text-xs font-medium ${
            isResolved
              ? "text-green-900 dark:text-green-700"
              : "text-red-900 dark:text-red-700"
          }`}
        >
          {isResolved ? (
            <span className="inline-flex gap-1">Resolved</span>
          ) : (
            <span className="inline-flex animate-pulse gap-1">Ongoing</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "started_at",
    header: "Started",
    cell: ({ row }) => {
      const dateString = row.getValue("started_at") as string;
      try {
        const date = parseISO(dateString);
        return <span className="">{format(date, "LLL dd, y HH:mm:ss")}</span>;
      } catch {
        return <span className="">Invalid Date</span>;
      }
    },
  },
  {
    accessorKey: "resolved_at",
    header: "Resolved",
    cell: ({ row }) => {
      const dateString = row.getValue("resolved_at") as string | null;
      if (!dateString) {
        return <span className="hidden md:inline">-</span>;
      }
      try {
        const date = parseISO(dateString);
        return (
          <span className="hidden md:inline">
            {format(date, "LLL dd, y HH:mm:ss")}
          </span>
        );
      } catch {
        return <span className="hidden">Invalid Date</span>;
      }
    },
  },
  {
    accessorKey: "downtime_duration_ms",
    header: "Duration",
    cell: ({ row }) => {
      let durationMs = row.getValue("downtime_duration_ms") as number | null;

      if (!durationMs) {
        const startedAt = row.getValue("started_at") as string;
        const resolvedAt = row.getValue("resolved_at") as string | null;

        if (startedAt && resolvedAt) {
          try {
            const startDate = parseISO(startedAt);
            const endDate = parseISO(resolvedAt);
            durationMs = endDate.getTime() - startDate.getTime();
          } catch {
            durationMs = null;
          }
        }
      }

      if (!durationMs) {
        return <span className="">-</span>;
      }

      const seconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return <span className="">{`${days}d ${hours % 24}h`}</span>;
      } else if (hours > 0) {
        return <span className="">{`${hours}h ${minutes % 60}m`}</span>;
      } else if (minutes > 0) {
        return <span className="">{`${minutes}m ${seconds % 60}s`}</span>;
      } else {
        return <span className="">{`${seconds}s`}</span>;
      }
    },
  },
  {
    accessorKey: "acknowledged_at",
    header: "Acknowledged",
    cell: ({ row }) => {
      const dateString = row.getValue("acknowledged_at") as string | null;
      if (!dateString) {
        return <span className="hidden md:inline">-</span>;
      }
      try {
        const date = parseISO(dateString);
        return (
          <span className="hidden md:inline">
            {format(date, "LLL dd, y HH:mm:ss")}
          </span>
        );
      } catch {
        return <span className="hidden md:inline">Invalid Date</span>;
      }
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => {
      return (
        <ChevronRightIcon className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      );
    },
  },
];

interface IncidentsTableProps {
  data: Partial<Incident>[];
}

export function IncidentsTable({ data }: IncidentsTableProps) {
  const navigate = useNavigate();
  const { workspaceName } = useParams({ strict: false });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = (incidentId: string) => {
    if (!workspaceName) return;

    navigate({
      to: "/dashboard/$workspaceName/incidents/$id",
      params: {
        workspaceName,
        id: incidentId,
      },
    });
  };

  return (
    <div className="w-full space-y-6">
      <h3 className="text-sm font-medium">Incidents</h3>
      <div className="w-full">
        <Table>
          <TableHeader className="text-muted-foreground border-dashed">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-dashed text-xs">
                {headerGroup.headers.map((header) => {
                  const isResolvedColumn = header.column.id === "resolved_at";
                  const isAcknowledgedColumn =
                    header.column.id === "acknowledged_at";
                  const shouldHide = isResolvedColumn || isAcknowledgedColumn;

                  return (
                    <TableHead
                      key={header.id}
                      className={`text-muted-foreground ${shouldHide ? "hidden md:table-cell" : ""}`}
                    >
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
              table.getRowModel().rows.map((row) => {
                const incidentId = row.original.id;
                return (
                  <TableRow
                    key={row.id}
                    className="group hover:bg-muted/50 cursor-pointer text-xs"
                    onClick={() =>
                      incidentId && handleRowClick(incidentId.toString())
                    }
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isResolvedColumn = cell.column.id === "resolved_at";
                      const isAcknowledgedColumn =
                        cell.column.id === "acknowledged_at";
                      const shouldHide =
                        isResolvedColumn || isAcknowledgedColumn;

                      return (
                        <TableCell
                          key={cell.id}
                          className={shouldHide ? "hidden md:table-cell" : ""}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground text-center text-xs"
                >
                  No incidents found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
