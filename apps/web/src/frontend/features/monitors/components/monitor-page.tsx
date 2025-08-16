import ConfirmationDialog from "@/frontend/components/confirmation-dialog";
import DashboardHeader from "@/frontend/components/dashboard-header";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { StatusDot } from "@/frontend/components/ui/status-dot";
import {
  useDeleteMonitor,
  usePauseResumeMonitor,
} from "@/frontend/features/monitors/api/mutations";
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
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

  const { days } = Route.useSearch();

  const navigate = useNavigate();
  const router = useRouter();
  const { id, workspaceName } = Route.useParams();

  const deleteMonitorMutation = useDeleteMonitor();
  const pauseResumeMutation = usePauseResumeMonitor();

  const handleDaysChange = (newDays: number) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id },
      search: { days: newDays },
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

  const currentPeriod =
    PERIOD_OPTIONS.find((p) => p.value === days)?.label || `Last ${days} days`;

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title={`Dashboard / ${workspaceName} / Monitor`}>
        <div className="flex items-center space-x-3">
          <StatusDot pulse color="bg-green-700" size="sm" />
          {monitor.last_check_at && (
            <span className="text-muted-foreground hidden font-mono text-sm tracking-tighter sm:block">
              Checked{" "}
              {formatDistanceToNowStrict(monitor.last_check_at, {
                addSuffix: true,
              })}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="text-xs">
                {currentPeriod}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PERIOD_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleDaysChange(option.value)}
                  className={cn(
                    "w-full text-xs",
                    option.value === days && "bg-accent"
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
              <DropdownMenuItem asChild>
                <ConfirmationDialog
                  trigger={
                    <div className="flex w-full cursor-pointer items-center px-2 py-1.5 text-xs text-red-500 focus:bg-red-50 focus:text-red-500 focus:dark:bg-red-900 focus:dark:text-white">
                      Delete
                    </div>
                  }
                  title="Delete Monitor"
                  description={`Are you sure you want to delete "${monitor.name}"? This action cannot be undone and will permanently remove all monitoring data.`}
                  confirmText="Delete"
                  cancelText="Cancel"
                  variant="destructive"
                  onConfirm={handleDelete}
                />
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
