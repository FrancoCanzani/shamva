import type { Incident } from "@/frontend/lib/types";
import { cn, getRegionFlags } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";

export default function MonitorIncidentsSection({
  incidents,
}: {
  incidents: Partial<Incident>[];
}) {
  const { workspaceName } = Route.useParams();

  const getIncidentStatus = (incident: Partial<Incident>) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "text-green-700" };
    }
    if (incident.acknowledged_at) {
      return {
        status: "acknowledged",
        label: "Acknowledged",
        color: "text-orange-700",
      };
    }
    return { status: "active", label: "Active", color: "text-red-700" };
  };

  if (incidents.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-sm font-medium">Incidents</h2>
        <div className="rounded-md border border-dashed p-8">
          <p className="text-muted-foreground text-center text-sm">
            No incidents reported
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-medium">Incidents</h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {incidents.map((incident) => {
          const status = getIncidentStatus(incident);

          return (
            <Link
              to="/dashboard/$workspaceName/incidents/$id"
              params={{ workspaceName, id: incident.id! }}
              key={incident.id}
              className="group hover:bg-carbon-50 dark:hover:bg-carbon-800 block rounded-md border p-2 shadow-xs transition-colors"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-foreground text-sm font-medium",
                      status.color,
                      {
                        "animate-pulse": status.status === "active",
                      }
                    )}
                  >
                    {status.label} Incident
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Started{" "}
                  {formatDistanceToNowStrict(parseISO(incident.started_at!), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between">
                {incident.regions_affected &&
                  incident.regions_affected.length > 0 && (
                    <div className="flex items-center justify-between gap-x-1.5 text-xs">
                      <span className="text-muted-foreground">
                        Regions affected:
                      </span>
                      <span className="font-medium">
                        {getRegionFlags(incident.regions_affected)}
                      </span>
                    </div>
                  )}

                <ArrowRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
