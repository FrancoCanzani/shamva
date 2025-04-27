import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Monitor } from "@/frontend/lib/types";
import MonitorsTableRow from "./monitors-table-row";
interface MonitorsListProps {
  monitors: Monitor[];
}

export function MonitorsList({ monitors }: MonitorsListProps) {
  return (
    <div className="p-4 space-y-8">
      <h2 className="font-medium text-xl">Monitors</h2>
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="w-8 pl-4 pr-2"></TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Recent Checks (7)</TableHead>
              <TableHead className="text-center">24h Avail.</TableHead>
              <TableHead className="text-center">7d Avail.</TableHead>
              <TableHead className="text-right">Avg Latency (7d)</TableHead>
              <TableHead>Next Check</TableHead>
              <TableHead className="w-8 pl-2 pr-4"></TableHead> {/* Chevron */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {monitors.length > 0 ? (
              monitors.map((monitor) => (
                <MonitorsTableRow key={monitor.id} monitor={monitor} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-gray-500 dark:text-gray-400"
                >
                  No monitors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
