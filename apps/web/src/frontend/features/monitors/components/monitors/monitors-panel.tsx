import { Card } from "@/frontend/components/ui/card";
import { StatusDot } from "@/frontend/components/ui/status-dot";
import { Monitor } from "@/frontend/types/types";
import { getMonitorStatusColor } from "@/frontend/utils/utils";
import { formatDistanceToNowStrict } from "date-fns";

export default function MonitorsPanel({ monitor }: { monitor?: Monitor }) {
  console.log(monitor);

  return (
    <Card className="rounded-md p-4 md:sticky md:top-4">
      {monitor ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusDot
                pulse
                color={getMonitorStatusColor(monitor.status)}
                size="sm"
              />
              <h3 className="text-sm font-medium">{monitor.name}</h3>
            </div>
            <div className="text-muted-foreground text-xs">
              {monitor.check_type === "tcp"
                ? monitor.tcp_host_port
                : monitor.url}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1 rounded border p-2">
              <div className="text-muted-foreground">Type</div>
              <div className="uppercase">{monitor.check_type}</div>
            </div>
            <div className="space-y-1 rounded border p-2">
              <div className="text-muted-foreground">Frequency</div>
              <div>{Math.round(monitor.interval / 60000)} min</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1 rounded border p-2">
              <div className="text-muted-foreground">Last check</div>
              <div>
                {monitor.last_check_at
                  ? formatDistanceToNowStrict(new Date(monitor.last_check_at), {
                      addSuffix: true,
                    })
                  : "—"}
              </div>
            </div>
            <div className="space-y-1 rounded border p-2">
              <div className="text-muted-foreground">Last success</div>
              <div>
                {monitor.last_success_at
                  ? formatDistanceToNowStrict(
                      new Date(monitor.last_success_at),
                      { addSuffix: true }
                    )
                  : "—"}
              </div>
            </div>
            <div className="space-y-1 rounded border p-2">
              <div className="text-muted-foreground">Last failure</div>
              <div>
                {monitor.last_failure_at
                  ? formatDistanceToNowStrict(
                      new Date(monitor.last_failure_at),
                      { addSuffix: true }
                    )
                  : "—"}
              </div>
            </div>
            <div className="space-y-1 rounded border p-2">
              <div className="text-muted-foreground">Regions</div>
              <div className="truncate uppercase">
                {monitor.regions?.join(", ") || "—"}
              </div>
            </div>
          </div>
          {monitor.error_message && (
            <div className="dark:border-border space-y-1 rounded border border-red-200 bg-red-50 p-2 text-xs dark:bg-stone-950">
              <div className="text-muted-foreground">Last error</div>
              <div className="line-clamp-3 text-xs text-red-800 dark:text-red-50">
                {monitor.error_message}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">
          Hover a monitor to preview its details
        </div>
      )}
    </Card>
  );
}
