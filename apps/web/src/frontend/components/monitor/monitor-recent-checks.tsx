import { Log } from "@/frontend/lib/types";
import {
  cn,
  getOkStatusColor,
  getRegionNameFromCode,
  getStatusColor,
} from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
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

export default function MonitorRecentChecks({
  logs,
  maxItems = 10,
}: RecentChecksProps) {
  const { workspaceName } = Route.useParams();

  const sortedLogs = [...logs].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayLogs = sortedLogs.slice(0, maxItems);

  if (!displayLogs.length) {
    return (
      <div>
        <div className="border border-dashed p-8">
          <p className="text-muted-foreground text-center text-sm">
            No recent logs available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex w-full items-center justify-between">
        <h2 className="text-sm font-medium">Recent checks</h2>
        <Link
          to="/dashboard/$workspaceName/logs"
          params={{ workspaceName: workspaceName }}
          className="text-muted-foreground flex items-center justify-start gap-1 text-xs"
        >
          <span className="hover:underline">View all logs</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <div className="space-y-2">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-dashed text-sm">
                <TableHead className=""></TableHead>
                <TableHead className="">
                  {displayLogs[0].check_type === "http" ? "Code" : "Result"}
                </TableHead>
                <TableHead className="">Latency</TableHead>
                <TableHead className="hidden flex-1 items-center justify-start sm:flex">
                  Region
                </TableHead>
                <TableHead className="w-20">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLogs.map((log, index) => (
                <TableRow
                  key={log.id || index}
                  className="hover:bg-carbon-50 dark:hover:bg-carbon-800 rounded-xs border-dashed"
                >
                  <TableCell className="py-2">
                    <div
                      className={cn(
                        "size-2 rounded-xs",
                        log.check_type === "http" &&
                          typeof log.status_code === "number"
                          ? getStatusColor(log.status_code)
                          : getOkStatusColor(log.ok)
                      )}
                      title={
                        log.check_type === "http" &&
                        typeof log.status_code === "number"
                          ? `Status code: ${log.status_code}`
                          : typeof log.ok === "boolean"
                            ? log.ok
                              ? "Success"
                              : log.error
                                ? `Error: ${log.error}`
                                : "Failed"
                            : log.error
                              ? `Error: ${log.error}`
                              : "Unknown status"
                      }
                    />
                  </TableCell>
                  <TableCell className="py-2 font-mono text-xs">
                    {log.check_type === "http" &&
                    typeof log.status_code === "number"
                      ? log.status_code
                      : log.ok
                        ? "Ok"
                        : "Error"}
                  </TableCell>
                  <TableCell className="py-2 font-mono text-xs">
                    {log.latency && log.latency >= 0
                      ? `${Math.round(log.latency)}ms`
                      : "-"}
                  </TableCell>
                  <TableCell className="hidden py-2 text-xs sm:block">
                    {(log.region && getRegionNameFromCode(log.region)) || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground py-2 text-xs">
                    {log.created_at &&
                      format(parseISO(log.created_at), "MMM dd, HH:mm:ss")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
