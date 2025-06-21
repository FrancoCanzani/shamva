import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Monitor } from "@/frontend/lib/types";
import MonitorsTableRow from "./monitors-table-row";

export function MonitorsTable({ monitors }: { monitors: Monitor[] }) {
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader className="">
          <TableRow className="border-b border-dashed font-mono">
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
    </div>
  );
}
