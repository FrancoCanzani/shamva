import { Card } from "@/frontend/components/ui/card";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { StatusDot } from "@/frontend/components/ui/status-dot";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Monitor } from "@/frontend/types/types";
import { cn, getMonitorStatusColor } from "@/frontend/utils/utils";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MonitorWithLastIncident } from "../../types";

export default function MonitorsTable({
  monitors,
  onSelectionChange,
}: {
  monitors: MonitorWithLastIncident[];
  onSelectionChange: (selectedMonitors: Monitor[]) => void;
}) {
  const { workspaceName } = Route.useParams();
  const [selectedMonitors, setSelectedMonitors] = useState(new Set<string>());
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredMonitors = useMemo(() => {
    return monitors.filter((monitor) => {
      const matchesGlobal =
        !globalFilter ||
        monitor.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        monitor.url?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        monitor.tcp_host_port
          ?.toLowerCase()
          .includes(globalFilter.toLowerCase());

      const matchesStatus = !statusFilter || monitor.status === statusFilter;
      const matchesType = !typeFilter || monitor.check_type === typeFilter;

      return matchesGlobal && matchesStatus && matchesType;
    });
  }, [monitors, globalFilter, statusFilter, typeFilter]);

  const selectedMonitorObjects = useMemo(() => {
    return filteredMonitors.filter((monitor) =>
      selectedMonitors.has(monitor.id)
    );
  }, [filteredMonitors, selectedMonitors]);

  const stats = useMemo(() => {
    const errorMonitors = monitors.filter(
      (m) => m.status === "error" || m.status === "broken"
    );
    const openIncidents = monitors.reduce((total, monitor) => {
      return monitor.last_incident?.status === "ongoing" ? total + 1 : total;
    }, 0);
    return { errorMonitors: errorMonitors.length, openIncidents };
  }, [monitors]);

  const filterOptions = useMemo(
    () => ({
      statuses: Array.from(new Set(monitors.map((m) => m.status))),
      types: Array.from(new Set(monitors.map((m) => m.check_type))),
    }),
    [monitors]
  );

  useEffect(() => {
    onSelectionChange(selectedMonitorObjects);
  }, [selectedMonitorObjects, onSelectionChange]);

  const toggleSelection = useCallback((monitorId: string) => {
    setSelectedMonitors((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(monitorId)) {
        newSelection.delete(monitorId);
      } else {
        newSelection.add(monitorId);
      }
      return newSelection;
    });
  }, []);

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent, monitorId: string) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(monitorId);
    },
    [toggleSelection]
  );

  return (
    <div className="space-y-4">
      {(stats.errorMonitors > 0 || stats.openIncidents > 0) && (
        <div className="bg-background flex items-center gap-4 rounded border px-3.5 py-2">
          {stats.errorMonitors > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-xs bg-red-500"></div>
              <span className="text-xs font-medium">
                {stats.errorMonitors} Monitor
                {stats.errorMonitors === 1 ? "" : "s"} with errors
              </span>
            </div>
          )}
          {stats.openIncidents > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-xs bg-orange-500"></div>
              <span className="text-xs font-medium">
                {stats.openIncidents} Active incident
                {stats.openIncidents === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search monitors..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 max-w-sm text-xs"
        />
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) =>
            setStatusFilter(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="!h-8 text-xs capitalize">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Status
            </SelectItem>
            {filterOptions.statuses.map((status) => (
              <SelectItem
                key={status}
                value={status}
                className="text-xs capitalize"
              >
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter || "all"}
          onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}
        >
          <SelectTrigger className="!h-8 text-xs capitalize">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Types
            </SelectItem>
            {filterOptions.types.map((type) => (
              <SelectItem key={type} value={type} className="text-xs uppercase">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {filteredMonitors.length > 0 ? (
          filteredMonitors.map((monitor) => (
            <Link
              key={monitor.id}
              to="/dashboard/$workspaceName/monitors/$id"
              params={{ workspaceName, id: monitor.id }}
              search={{ days: 7 }}
              className="mb-2 block last:mb-0"
            >
              <Card
                className={cn(
                  "group flex flex-row items-center justify-between rounded p-2.5 hover:bg-stone-50 dark:hover:bg-stone-900",
                  selectedMonitors.has(monitor.id) &&
                    "bg-stone-50 dark:bg-stone-900"
                )}
              >
                <div className="flex items-center justify-start gap-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedMonitors.has(monitor.id)}
                      onCheckedChange={() => toggleSelection(monitor.id)}
                      onClick={(e) => handleCheckboxClick(e, monitor.id)}
                      aria-label="Select monitor"
                    />
                    <StatusDot
                      pulse
                      color={getMonitorStatusColor(monitor.status)}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{monitor.name}</h3>
                    <p className="text-muted-foreground text-xs">
                      {monitor.check_type === "tcp"
                        ? monitor.tcp_host_port
                        : monitor.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  {monitor.last_check_at && (
                    <span className="text-muted-foreground text-xs">
                      Checked{" "}
                      {formatDistanceToNowStrict(
                        new Date(monitor.last_check_at),
                        { addSuffix: true }
                      )}
                    </span>
                  )}
                  {monitor.last_incident?.status === "ongoing" && (
                    <span className="bg-muted animate-pulse rounded border px-1.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-50">
                      Ongoing incident
                    </span>
                  )}
                  <ChevronRight className="text-muted-foreground h-3 w-3 opacity-0 transition-all duration-150 group-hover:opacity-100" />
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-muted-foreground col-span-full rounded-md border border-dashed py-4 text-center text-sm">
            No results.
          </div>
        )}
      </div>

      {selectedMonitors.size > 0 && (
        <div className="text-muted-foreground text-center text-xs">
          {selectedMonitors.size} of {filteredMonitors.length} monitor(s)
          selected
        </div>
      )}
    </div>
  );
}
