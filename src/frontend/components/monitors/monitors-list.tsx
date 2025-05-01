import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Monitor } from "@/frontend/lib/types";
import { Link } from "@tanstack/react-router";
import MonitorsTableRow from "./monitors-table-row";
interface MonitorsListProps {
  monitors: Monitor[];
}

export function MonitorsList({ monitors }: MonitorsListProps) {
  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-xl">Monitors</h2>
        <Link to="/dashboard/monitors/new">New</Link>
      </div>
      <div className="overflow-auto">
        {monitors.length > 0 ? (
          <Table>
            <TableHeader className="">
              <TableRow className="border-b border-dashed font-mono border-gray-200 dark:border-gray-700">
                <TableHead className="w-8"></TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Last check</TableHead>
                <TableHead>Recent</TableHead>
                <TableHead className="text-left">24h</TableHead>
                <TableHead className="text-left">7d</TableHead>
                <TableHead className="text-left">Avg Latency</TableHead>
                <TableHead>Regions</TableHead>
                <TableHead className="w-8 pl-2 pr-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((monitor) => (
                <MonitorsTableRow key={monitor.id} monitor={monitor} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="w-full text-center text-muted-foreground">
            No monitors found
          </div>
        )}
      </div>
    </div>
  );
}
