import { Log } from "@/frontend/lib/types";
import {
  cn,
  getRegionNameFromCode,
  getStatusColor,
} from "@/frontend/lib/utils";
import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface RecentChecksProps {
  logs: Partial<Log>[];
  maxItems?: number;
}

export default function RecentChecks({
  logs,
  maxItems = 10,
}: RecentChecksProps) {
  const sortedLogs = [...logs].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayLogs = sortedLogs.slice(0, maxItems);

  if (!displayLogs.length) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        No recent logs available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-dashed text-sm">
              <TableHead className=""></TableHead>
              <TableHead className="">Code</TableHead>
              <TableHead className="">Latency</TableHead>
              <TableHead className="flex-1 hidden sm:flex items-center justify-start">
                Region
              </TableHead>
              <TableHead className="w-20">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLogs.map((log, index) => (
              <TableRow
                key={log.id || index}
                className="hover:bg-slate-50 border-dashed"
              >
                <TableCell className="py-2">
                  <div
                    className={cn("size-2", getStatusColor(log.status_code))}
                    title={
                      typeof log.status_code === "number"
                        ? `Status code: ${log.status_code}`
                        : log.error
                          ? `Error: ${log.error}`
                          : "Unknown status"
                    }
                  />
                </TableCell>
                <TableCell className="font-mono text-xs py-2">
                  {typeof log.status_code === "number"
                    ? log.status_code
                    : "ERR"}
                </TableCell>
                <TableCell className="font-mono text-xs py-2">
                  {log.latency && log.latency >= 0
                    ? `${Math.round(log.latency)}ms`
                    : "N/A"}
                </TableCell>
                <TableCell className="text-xs py-2 hidden sm:block">
                  {(log.region && getRegionNameFromCode(log.region)) || "N/A"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground py-2">
                  {log.created_at &&
                    format(parseISO(log.created_at), "MMM dd, HH:mm:ss")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
