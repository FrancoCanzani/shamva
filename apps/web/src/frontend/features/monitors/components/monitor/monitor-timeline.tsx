import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Incident } from "@/frontend/types/types";
import { getRegionNameFromCode } from "@/frontend/utils/utils";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";

interface MonitorTimelineProps {
  incidents: Partial<Incident>[];
}

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
}

function IncidentDetails({ incident }: { incident: Partial<Incident> }) {
  const details = [];

  if (incident.regions_affected && incident.regions_affected.length > 0) {
    const regionNames = incident.regions_affected.map((code) =>
      getRegionNameFromCode(code)
    );
    details.push(`Regions: ${regionNames.join(", ")}`);
  }

  if (incident.downtime_duration_ms) {
    details.push(`Duration: ${formatDuration(incident.downtime_duration_ms)}`);
  }

  return (
    <div className="space-y-0.5">
      {details.map((detail, index) => (
        <p key={index} className="text-xs text-gray-500">
          {detail}
        </p>
      ))}
    </div>
  );
}

export function MonitorTimeline({ incidents }: MonitorTimelineProps) {
  const navigate = useNavigate();
  const { workspaceName } = useParams({ strict: false });

  const handleSeeDetails = (incidentId: string) => {
    if (!workspaceName) return;

    navigate({
      to: "/dashboard/$workspaceName/incidents/$id",
      params: {
        workspaceName,
        id: incidentId,
      },
    });
  };

  if (incidents.length === 0) {
    return (
      <div className="w-full space-y-4">
        <h3 className="text-sm font-medium">Incidents Timeline</h3>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <div className="space-y-2">
            <div className="text-2xl">📊</div>
            <h4 className="font-medium text-gray-900">No incidents</h4>
            <p className="text-sm text-gray-600">
              Your monitor has been running smoothly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timelineEvents = incidents.flatMap((incident) => {
    const events = [];

    if (incident.started_at) {
      events.push({
        id: `start-${incident.id}`,
        incidentId: incident.id!,
        title: "Incident Started",
        date: format(parseISO(incident.started_at), "dd/MM/yyyy h:mm a"),
        timestamp: incident.started_at,
        incident,
        hasDetails: true,
        type: "start",
      });
    }

    if (incident.acknowledged_at) {
      events.push({
        id: `ack-${incident.id}`,
        incidentId: incident.id!,
        title: "Incident Acknowledged",
        date: format(parseISO(incident.acknowledged_at), "dd/MM/yyyy h:mm a"),
        timestamp: incident.acknowledged_at,
        incident,
        hasDetails: false,
        type: "acknowledged",
      });
    }

    if (incident.resolved_at) {
      events.push({
        id: `end-${incident.id}`,
        incidentId: incident.id!,
        title: "Incident Resolved",
        date: format(parseISO(incident.resolved_at), "dd/MM/yyyy h:mm a"),
        timestamp: incident.resolved_at,
        incident,
        hasDetails: true,
        type: "resolved",
      });
    }

    return events;
  });

  // Sort by timestamp (oldest first for chronological order)
  timelineEvents.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-medium">Incidents Timeline</h3>

      <Card className="w-full bg-white">
        <CardContent className="space-y-3 p-4">
          {timelineEvents.map((item, index) => (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400"></div>
                {index < timelineEvents.length - 1 && (
                  <div className="mt-1 h-8 w-px bg-gray-200"></div>
                )}
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-start justify-between">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  {item.hasDetails && (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-green-600"
                      onClick={() => handleSeeDetails(item.incidentId)}
                    >
                      See Details
                    </Button>
                  )}
                </div>
                <p className="mb-1 text-xs text-gray-500">{item.date}</p>

                {item.hasDetails && (
                  <IncidentDetails incident={item.incident} />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
