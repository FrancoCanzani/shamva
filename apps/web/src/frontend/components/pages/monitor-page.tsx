import { supabase } from "@/frontend/lib/supabase";
import { cn, getRegionFlags, getStatusColor } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNowStrict, parseISO, subDays } from "date-fns";
import { ArrowLeft } from "lucide-react";
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
    <div className="flex flex-1 w-full mx-auto p-4 flex-col">
      <div className="flex items-center justify-between gap-6">
        <Link
          to="/dashboard/$workspaceName/monitors"
          params={{ workspaceName: workspaceName }}
          className="flex items-center justify-start text-xs gap-1 text-muted-foreground"
        >
          <ArrowLeft className="size-3" />
          <span className="hover:underline">Back to monitors</span>
        </Link>
        <div className="flex items-center gap-1">
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
                  className={cn(option.value === days && "bg-accent")}
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
                >
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.invalidate()}>
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 hover:text-red-500"
                onClick={handleDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-start gap-1">
          <h1 className="flex-1 font-medium">{monitor.name || monitor.url}</h1>
          {monitor.name && (
            <a
              href={monitor.url}
              className="text-xs hover:underline text-muted-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              {monitor.url}
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-3">
            <button>
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping -full duration-[2000ms]",
                    getStatusColor(sortedLogs[0]?.status_code)
                  )}
                ></span>
                <span
                  className={cn(
                    "absolute inline-flex h-2 w-2 -full bg-red-500",
                    getStatusColor(sortedLogs[0]?.status_code)
                  )}
                ></span>
              </span>
            </button>
            <span className={cn("font-medium capitalize")}>
              {monitor.status}
            </span>
            <span className="text-sm text-muted-foreground">
              Last checked {lastCheck}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground">Method:</div>
              <div className="text-sm font-medium">{monitor.method}</div>
            </div>
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground">Interval:</div>
              <div className="text-sm font-medium">
                {monitor.interval / 60000} min
              </div>
            </div>
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground">Regions:</div>
              <div className="text-sm">{getRegionFlags(monitor.regions)}</div>
            </div>
          </div>
        </div>

        <Separator />

        <MonitorStats logs={filteredLogs} />

        <Separator />

        <IncidentsSection incidents={monitor.incidents || []} />

        <Separator />

        <div>
          <h2 className="text-sm font-medium mb-4">Latency Trends by Region</h2>
          <RegionLatencyCharts logs={filteredLogs} height={36} />
        </div>

        <Separator />
        <div>
          <div className="w-full mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent checks</h2>
            <Link
              to="/dashboard/$workspaceName/logs"
              params={{ workspaceName: workspaceName }}
              className="text-sm hover:underline"
            >
              View all logs
            </Link>
          </div>
          <RecentChecks logs={monitor.recent_logs} />
        </div>
      </div>
    </div>
  );
}
