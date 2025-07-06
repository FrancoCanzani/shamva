import { supabase } from "@/frontend/lib/supabase";
import { cn, getRegionFlags, getStatusColor } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { useMutation } from "@tanstack/react-query";
import { Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ConfirmationDialog from "../comfirmation-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const PERIOD_OPTIONS = [
  { value: 1, label: "Last day" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
];

export default function MonitorHeader() {
  const navigate = useNavigate();
  const router = useRouter();
  const monitor = Route.useLoaderData();
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
    <>
      <div className="flex flex-col items-start justify-between gap-6">
        <div>
          <Link
            to="/dashboard/$workspaceName/monitors"
            params={{ workspaceName }}
            className="text-muted-foreground flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="size-3" />
            <span className="hover:underline">Back to monitors</span>
          </Link>
        </div>
      </div>

      <div className="inline-flex justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-xs border p-1 text-sm font-medium uppercase">
            {monitor.check_type}
          </span>
          <div className="inline-flex items-baseline gap-2">
            <h2 className="flex-1 text-xl font-medium">{monitor.name}</h2>

            {monitor.name && (
              <span className="text-muted-foreground text-[0.6rem]">
                {monitor.check_type === "tcp"
                  ? monitor.tcp_host_port
                  : monitor.url}
              </span>
            )}
          </div>
        </div>

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
              <Button variant="outline" size="xs" className="text-xs">
                Options
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
      </div>

      <div className="inline-flex justify-between">
        <div className="flex items-center gap-2">
          <div>
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute h-full w-full animate-ping rounded-xs duration-[2000ms]",
                  getStatusColor(sortedLogs[0]?.ok ? 200 : 500)
                )}
              />
              <span
                className={cn(
                  "absolute h-2 w-2 rounded-xs",
                  getStatusColor(sortedLogs[0]?.ok ? 200 : 500)
                )}
              />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-medium capitalize">{monitor.status}</span>

            <span className="text-muted-foreground text-xs">
              Last checked {lastCheck}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
    </>
  );
}
