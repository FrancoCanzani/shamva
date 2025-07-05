import { supabase } from "@/frontend/lib/supabase";
import { cn, getRegionFlags, getStatusColor } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNowStrict, parseISO, subDays } from "date-fns";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import MonitorStats from "../monitor/monitor-stats";
import RecentChecks from "../monitor/recent-checks";
import RegionLatencyCharts from "../monitor/region-latency-charts";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import IncidentsSection from "../monitor/incidents-section";

const PERIOD_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export default function MonitorPage() {
  const navigate = useNavigate();
  const monitor = Route.useLoaderData();
  const router = useRouter();
  const { days } = Route.useSearch();

  const { id, workspaceName } = Route.useParams();

  const handleDaysChange = (newDays: number) => {
    navigate({
      to: "/dashboard/$workspaceName/monitors/$id",
      params: { workspaceName, id },
      search: { days: newDays },
      replace: true,
    });
  };

  const filterDate = subDays(new Date(), days);
  const filteredLogs = (monitor.recent_logs || []).filter((log) => {
    if (!log.created_at) return false;
    const logDate = new Date(log.created_at);
    return logDate >= filterDate;
  });

  async function handleDelete() {
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

    try {
      const response = await fetch(`/api/monitors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        router.invalidate();
        toast.success("Monitor deleted");
        navigate({
          to: "/dashboard/$workspaceName/monitors",
          params: { workspaceName: workspaceName },
        });
      } else {
        toast.error("Error deleting monitor");
      }
    } catch (error) {
      console.error("Error deleting monitor:", error);
      toast.error("Error deleting monitor");
    }
  }

  const sortedLogs = [...monitor.recent_logs].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const lastCheck = monitor.last_check_at
    ? formatDistanceToNowStrict(parseISO(monitor.last_check_at), {
        addSuffix: true,
      })
    : "Never";

  const currentPeriod =
    PERIOD_OPTIONS.find((p) => p.value === days)?.label || `Last ${days} days`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-4">
      <div className="flex items-center justify-between gap-6">
        <Link
          to="/dashboard/$workspaceName/monitors"
          params={{ workspaceName: workspaceName }}
          className="text-muted-foreground flex items-center justify-start gap-1 text-xs"
        >
          <ArrowLeft className="size-3" />
          <span className="hover:underline">Back to monitors</span>
        </Link>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger>
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
              <Button variant={"outline"} size={"xs"} className="text-xs">
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link
                  to="/dashboard/$workspaceName/monitors/$id/edit"
                  params={{ id: monitor.id, workspaceName: workspaceName }}
                  className="w-full text-xs"
                >
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.invalidate()}
                className="w-full text-xs"
              >
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem
                className="w-full text-xs text-red-500 hover:text-red-500 focus:bg-red-50 focus:text-red-500 focus:dark:bg-red-900 focus:dark:text-white"
                onClick={handleDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center justify-between gap-4 py-4">
        <div className="flex items-center justify-start gap-1">
          <h1 className="flex-1 text-xl font-medium">{monitor.name}</h1>
          {monitor.name && (
            <span className="text-muted-foreground text-xs">
              {monitor.check_type === "tcp"
                ? monitor.tcp_host_port
                : monitor.url}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-8 overflow-y-auto">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="pl-1">
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-xs duration-[2000ms]",
                    getStatusColor(sortedLogs[0]?.ok ? 200 : 500)
                  )}
                ></span>
                <span
                  className={cn(
                    "-full absolute inline-flex h-2 w-2 rounded-xs",
                    getStatusColor(sortedLogs[0]?.ok ? 200 : 500)
                  )}
                ></span>
              </span>
            </div>
            <span className={cn("font-medium capitalize")}>
              {monitor.status}
            </span>
            <span className="text-muted-foreground text-xs">
              Last checked {lastCheck}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            {monitor.check_type === "http" && (
              <div className="flex gap-2">
                <div className="text-muted-foreground text-sm">Method:</div>
                <div className="text-sm font-medium">{monitor.method}</div>
              </div>
            )}
            <div className="flex gap-2">
              <div className="text-muted-foreground text-sm">Interval:</div>
              <div className="text-sm font-medium">
                {monitor.interval / 60000} min
              </div>
            </div>
            <div className="flex gap-2">
              <div className="text-muted-foreground text-sm">Regions:</div>
              <div className="text-sm">{getRegionFlags(monitor.regions)}</div>
            </div>
          </div>
        </div>

        <Separator />

        <MonitorStats logs={filteredLogs} />

        <Separator />

        <IncidentsSection incidents={monitor.incidents || []} />

        <Separator />

        <RegionLatencyCharts logs={filteredLogs} height={36} />

        <Separator />
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
          <RecentChecks logs={monitor.recent_logs} />
        </div>
      </div>
    </div>
  );
}
