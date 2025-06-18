import { Incident } from "@/frontend/lib/types";
import { cn, getRegionFlags } from "@/frontend/lib/utils";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { CheckCircle, ExternalLink, MoreHorizontal } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";

export default function IncidentsSection({ incidents }: {incidents: Partial<Incident>[]}) {
  const { workspaceName } = Route.useParams();

  const getIncidentStatus = (incident: Partial<Incident>) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "bg-emerald-500" };
    }
    if (incident.acknowledged_at) {
      return { status: "acknowledged", label: "Acknowledged", color: "bg-amber-500" };
    }
    return { status: "active", label: "Active", color: "bg-red-500" };
  };

  const getDuration = (startedAt: string, resolvedAt?: string | null) => {
    const start = parseISO(startedAt);
    const end = resolvedAt ? parseISO(resolvedAt) : new Date();
    return formatDistanceToNowStrict(start, { addSuffix: false });
  };

  if (incidents.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium mb-4">Incidents</h2>
        <div className="border-dashed">
          <div className="pt-6">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No incidents reported</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-medium mb-4">Incidents</h2>
      <div className="space-y-3">
        {incidents.map((incident) => {
          const status = getIncidentStatus(incident);
          const duration = getDuration(incident.started_at!, incident.resolved_at);
          
          return (
            <Link to="/dashboard/$workspaceName/incidents/$id" params={{ workspaceName, id: incident.id! }} key={incident.id} className="group hover:shadow-sm transition-shadow">
              <div className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", status.color)} />
                    <div>
                      <div className="text-sm font-medium">
                        {status.label} Incident
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Started {formatDistanceToNowStrict(parseISO(incident.started_at!), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {duration}
                    </Badge>
                    {incident.screenshot_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(incident.screenshot_url!, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Link
                    to="/dashboard/$workspaceName/incidents/$id"
                    params={{
                      workspaceName,
                      id: incident.id!,
                    }}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="pt-0">
                <div className="space-y-2">
                  {incident.regions_affected && incident.regions_affected.length > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Regions affected:</span>
                      <span>{getRegionFlags(incident.regions_affected)}</span>
                    </div>
                  )}
                  
                  {incident.downtime_duration_ms && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total downtime:</span>
                      <span>{Math.round(incident.downtime_duration_ms / 1000 / 60)} minutes</span>
                    </div>
                  )}
                  
                  {incident.post_mortem && (
                    <>
                      <Separator className="my-2" />
                      <div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {incident.post_mortem}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 