import type { Incident } from "@/frontend/lib/types"
import { getRegionFlags } from "@/frontend/lib/utils"
import { formatDistanceToNowStrict, parseISO } from "date-fns"
import {  ArrowRight } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id"
import { cn } from "@/frontend/lib/utils"

export default function IncidentsSection({ incidents }: { incidents: Partial<Incident>[] }) {
  const { workspaceName } = Route.useParams()

  const getIncidentStatus = (incident: Partial<Incident>) => {
    if (incident.resolved_at) {
      return { status: "resolved", label: "Resolved", color: "text-green-700" }
    }
    if (incident.acknowledged_at) {
      return { status: "acknowledged", label: "Acknowledged", color: "text-orange-700" }
    }
    return { status: "active", label: "Active", color: "text-red-700" }
  }

  if (incidents.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium mb-4">Incidents</h2>
        <div className="border border-dashed p-8">
            <p className="text-sm text-center text-muted-foreground">No incidents reported</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-medium mb-4">Incidents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {incidents.map((incident) => {
          const status = getIncidentStatus(incident)

          return (
            <Link
              to="/dashboard/$workspaceName/incidents/$id"
              params={{ workspaceName, id: incident.id! }}
              key={incident.id}
              className="group block border border-dashed p-2 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className={cn("text-sm font-medium text-foreground", status.color, {
                      "animate-pulse": status.status === "active"
                    })}>{status.label} Incident</div>
              
                </div>
                  <p className="text-xs text-muted-foreground">
                      Started {formatDistanceToNowStrict(parseISO(incident.started_at!), { addSuffix: true })}
                  </p>
                </div>

              <div className="flex items-center justify-between">
                {incident.regions_affected && incident.regions_affected.length > 0 && (
                  <div className="flex items-center justify-between text-xs gap-x-1.5">
                    <span className="text-muted-foreground">Regions affected:</span>
                    <span className="font-medium">{getRegionFlags(incident.regions_affected)}</span>
                  </div>
                )}

              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
