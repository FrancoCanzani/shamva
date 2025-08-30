import NotFoundMessage from "@/frontend/components/not-found-message";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { Incident } from "@/frontend/lib/types";
import { cn } from "@/frontend/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { calculateDowntime } from "../../utils";

export default function MonitorIncidentsList({
  data,
}: {
  data: Partial<Incident>[];
}) {
  const { workspaceSlug } = useParams({ strict: false });

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Incidents</h3>
        <NotFoundMessage message="No incidents found" />
      </div>
    );
  }

  const sortedIncidents = [...data].sort((a, b) => {
    const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
    const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Incidents</h3>
        <span className="text-muted-foreground text-xs">
          {data.length} total
        </span>
      </div>

      <div className="divide-y divide-dashed rounded-md">
        {sortedIncidents.map((incident) => (
          <Link
            key={incident.id}
            to="/dashboard/$workspaceSlug/incidents/$id"
            params={{
              workspaceSlug: workspaceSlug!,
              id: incident.id!,
            }}
            className="group block"
          >
            <div className="hover:bg-input/20 flex items-center px-1 py-2">
              <div className="flex min-w-0 flex-1 items-center space-x-2">
                <span
                  className={cn(
                    "rounded border px-1 py-0.5 font-mono text-xs font-medium capitalize",
                    incident.resolved_at
                      ? "text-green-800"
                      : incident.acknowledged_at
                        ? "text-yellow-500"
                        : "text-red-800"
                  )}
                >
                  {incident.resolved_at
                    ? "resolved"
                    : incident.acknowledged_at
                      ? "acknowledged"
                      : "ongoing"}
                </span>
                <Tooltip>
                  <TooltipTrigger className="text-muted-foreground text-xs underline decoration-dotted decoration-1 underline-offset-2">
                    {`Downtime ${calculateDowntime(incident)}`}
                  </TooltipTrigger>
                  <TooltipContent className="flex flex-col gap-2 font-mono tracking-tighter">
                    {incident.started_at && (
                      <span>
                        Started at{" "}
                        {format(
                          new Date(incident.started_at),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    )}
                    {incident.acknowledged_at && (
                      <span>
                        Acknowledged at{" "}
                        {format(
                          new Date(incident.acknowledged_at),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    )}
                    {incident.resolved_at && (
                      <span>
                        Resolved at{" "}
                        {format(
                          new Date(incident.resolved_at),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                {incident.error_message && (
                  <p className="truncate text-xs text-red-800">
                    {incident.error_message}
                  </p>
                )}
                <ChevronRight className="text-muted-foreground invisible size-4 group-hover:visible" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
