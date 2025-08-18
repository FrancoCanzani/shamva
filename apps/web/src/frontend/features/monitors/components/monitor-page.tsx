import DashboardHeader from "@/frontend/components/dashboard-header";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { StatusDot } from "@/frontend/components/ui/status-dot";
import {
  useDeleteMonitor,
  usePauseResumeMonitor,
} from "@/frontend/features/monitors/api/mutations";
import { monitoringRegions } from "@/frontend/lib/constants";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { useMemo } from "react";
import MonitorHeader from "./monitor/monitor-header";
import MonitorIncidentsList from "./monitor/monitor-incidents-list";
import MonitorRegionLatencyCharts from "./monitor/monitor-region-latency-charts";
import MonitorStats from "./monitor/monitor-stats";
import { MonitorTimeline } from "./monitor/monitor-timeline";
import MonitorUptimeChart from "./monitor/monitor-uptime-chart";

const PERIOD_OPTIONS = [
  { value: 1, label: "Last day" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
];

export default function MonitorPage() {
  const monitor = Route.useLoaderData();

  const { days, region } = Route.useSearch();

  const navigate = useNavigate();
  const router = useRouter();
  const { id, workspaceName } = Route.useParams();

  const availableRegions = useMemo(() => {
    const configuredRegions = monitor.regions || [];
    return monitoringRegions.filter(r => configuredRegions.includes(r.value));
  }, [monitor.regions]);

  const deleteMonitorMutation = useDeleteMonitor();
  const pauseResumeMutation = usePauseResumeMonitor();

  const handleDaysChange = (newDays: number) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id },
      search: { days: newDays, region },
      replace: true,
    });
  };

  const handleRegionChange = (newRegion: string) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id },
      search: { days, region: newRegion === "all" ? undefined : newRegion },
      replace: true,
    });
  };

  const handleClearFilters = () => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id },
      search: { days: 7, region: undefined },
      replace: true,
    });
  };

  const handleDelete = () => {
    deleteMonitorMutation.mutate(id);
  };

  const handlePauseOrResumeMonitor = () => {
    const newStatus = monitor.status === "paused" ? "active" : "paused";
    pauseResumeMutation.mutate({ monitorId: id, status: newStatus });
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title={`Dashboard / ${workspaceName} / Monitor`}>
        <div className="flex items-center space-x-3">
          <StatusDot pulse color="bg-green-700" size="sm" />
          {monitor.last_check_at && (
            <span className="text-muted-foreground hidden text-sm lg:block">
              Checked{" "}
              {formatDistanceToNowStrict(monitor.last_check_at, {
                addSuffix: true,
              })}
            </span>
          )}
          <Select value={days.toString()} onValueChange={(value) => handleDaysChange(parseInt(value))}>
          <SelectTrigger size="sm" className="text-xs data-[size=sm]:h-7 px-2">
          <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {availableRegions.length > 1 && (
            <Select value={region || "all"} onValueChange={handleRegionChange}>
              <SelectTrigger size="sm" className="text-xs data-[size=sm]:h-7 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All regions
                </SelectItem>
                {availableRegions.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                   {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(days !== 7 || region) && (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleClearFilters}
              title="Clear filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z"/>
              </svg>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="xs" className="text-xs">
                <DotsHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link
                  to="/dashboard/$workspaceName/monitors/$id/edit"
                  params={{ id: monitor.id, workspaceName }}
                  search={{ days }}
                  className="w-full text-xs"
                >
                  Configure
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePauseOrResumeMonitor}
                className="w-full text-xs"
              >
                {monitor.status === "paused" ? "Resume" : "Pause"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.invalidate()}
                className="w-full text-xs"
              >
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="w-full text-xs"
                variant="destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DashboardHeader>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 overflow-auto p-6">
        <MonitorHeader />
        <MonitorStats logs={monitor.recent_logs || []} />
        <MonitorUptimeChart logs={monitor.recent_logs || []} />
        <MonitorRegionLatencyCharts logs={monitor.recent_logs || []} />
        <MonitorIncidentsList data={monitor.incidents || []} />
        <MonitorTimeline monitor={monitor} />
      </main>
    </div>
  );
}
