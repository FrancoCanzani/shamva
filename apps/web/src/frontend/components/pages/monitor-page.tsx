import { monitoringRegions } from "@/frontend/lib/constants";
import { supabase } from "@/frontend/lib/supabase";
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNow, subDays } from "date-fns";
import { toast } from "sonner";
import ConfirmationDialog from "../comfirmation-dialog";
import DashboardHeader from "../dashboard-header";
import { IncidentsTable } from "../monitor/incidents-table";
import MonitorHeader from "../monitor/monitor-header";
import MonitorRegionLatencyCharts from "../monitor/monitor-region-latency-charts";
import MonitorStats from "../monitor/monitor-stats";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { StatusDot } from "../ui/status-dot";

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

  const handleDaysChange = (newDays: number) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id },
      search: { days: newDays },
      replace: true,
    });
  };

  const handleRegionChange = (newRegion: string | undefined) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id },
      search: { days, region: newRegion },
      replace: true,
    });
  };

  const deleteMonitorMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw redirect({
          to: "/auth/login",
          search: { redirect: `/dashboard/monitors/${id}` },
          throw: true,
        });
      }

      const token = session.access_token;

      const response = await fetch(`/api/monitors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete monitor");
      }

      return response.json();
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Monitor deleted successfully");
      navigate({
        to: "/dashboard/$workspaceName/monitors",
        params: { workspaceName },
      });
    },
    onError: () => {
      toast.error("Failed to delete monitor");
    },
  });

  const handleDelete = () => {
    deleteMonitorMutation.mutate();
  };

  const pauseOrResumeMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw redirect({
          to: "/auth/login",
          search: { redirect: `/dashboard/monitors/${id}` },
          throw: true,
        });
      }

      const token = session.access_token;

      const response = await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          monitor.status === "paused"
            ? { status: "active" }
            : { status: "paused" }
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to delete monitor");
      }

      return response.json();
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Monitor updated successfully");
    },
    onError: () => {
      toast.error("Failed to update monitor");
    },
  });

  const handlePauseOrResumeMonitor = () => {
    pauseOrResumeMutation.mutate();
  };

  const currentPeriod =
    PERIOD_OPTIONS.find((p) => p.value === days)?.label || `Last ${days} days`;

  const filterDate = subDays(new Date(), days);
  let filteredLogs = (monitor.recent_logs || []).filter((log) => {
    if (!log.created_at) return false;
    const logDate = new Date(log.created_at);
    return logDate >= filterDate;
  });
  if (region) {
    filteredLogs = filteredLogs.filter((log) => log.region === region);
  }

  const availableRegions = Array.from(
    new Set(filteredLogs.map((log) => log.region).filter(Boolean))
  );
  const availableRegionObjs = availableRegions
    .map((code) => monitoringRegions.find((r) => r.value === code))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader>
        <div className="flex items-center space-x-3">
          <StatusDot pulse color="bg-green-700" size="sm" />
          {monitor.last_check_at && (
            <span className="text-sm">
              Checked{" "}
              {formatDistanceToNow(monitor.last_check_at, { addSuffix: true })}
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
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" className="text-xs">
                {region
                  ? monitoringRegions.find((r) => r.value === region)?.label ||
                    region
                  : "All Regions"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleRegionChange(undefined)}
                className={cn("w-full text-xs", !region && "bg-accent")}
              >
                All Regions
              </DropdownMenuItem>
              {availableRegionObjs.map((r) => (
                <DropdownMenuItem
                  key={r.value}
                  onClick={() => handleRegionChange(r.value)}
                  className={cn(
                    "w-full text-xs",
                    region === r.value && "bg-accent"
                  )}
                >
                  {r.label}
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
      <main className="flex-1 space-y-6 overflow-auto p-6">
        <MonitorHeader />
        <MonitorStats logs={filteredLogs} />
        <MonitorRegionLatencyCharts
          logs={filteredLogs}
          height={250}
          region={region}
        />
        <IncidentsTable data={monitor.incidents || []} />
      </main>
    </div>
  );
}
