import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/frontend/components/ui/accordion";
import { Button } from "@/frontend/components/ui/button";
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

function IncidentTimeline({ incident }: { incident: Partial<Incident> }) {
  const navigate = useNavigate();
  const { workspaceName } = useParams({ strict: false });

  const handleSeeDetails = () => {
    if (!workspaceName || !incident.id) return;

    navigate({
      to: "/dashboard/$workspaceName/incidents/$id",
      params: {
        workspaceName,
        id: incident.id,
      },
    });
  };

  const events = [];

  if (incident.started_at) {
    events.push({
      title: "Incident Started",
      timestamp: incident.started_at,
      details: incident.regions_affected?.length
        ? `Regions: ${incident.regions_affected.map((code) => getRegionNameFromCode(code)).join(", ")}`
        : null,
    });
  }

  if (incident.acknowledged_at) {
    events.push({
      title: "Incident Acknowledged",
      timestamp: incident.acknowledged_at,
      details: null,
    });
  }

  if (incident.resolved_at) {
    events.push({
      title: "Incident Resolved",
      timestamp: incident.resolved_at,
      details: incident.downtime_duration_ms
        ? `Duration: ${formatDuration(incident.downtime_duration_ms)}`
        : null,
    });
  }

  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Timeline</span>
        <Button
          variant="link"
          size="sm"
          onClick={handleSeeDetails}
          className="h-auto p-0 text-xs"
        >
          View Details
        </Button>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              {index < events.length - 1 && (
                <div className="mt-1 h-6 w-px bg-gray-200" />
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{event.title}</span>
                <span className="text-xs text-gray-500">
                  {format(parseISO(event.timestamp), "MMM d, HH:mm")}
                </span>
              </div>
              {event.details && (
                <p className="mt-1 text-xs text-gray-500">{event.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonitorTimeline({ incidents }: MonitorTimelineProps) {
  if (incidents.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Incidents Timeline</h3>
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="text-2xl">📊</div>
          <div className="mt-2 text-sm text-gray-500">No incidents found</div>
        </div>
      </div>
    );
  }

  const sortedIncidents = [...incidents].sort((a, b) => {
    const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
    const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Incidents Timeline</h3>
        <span className="text-muted-foreground text-xs">
          {incidents.length} total
        </span>
      </div>

      <Accordion type="single" collapsible>
        {sortedIncidents.map((incident) => (
          <AccordionItem key={incident.id} value={incident.id!}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center space-x-1.5 text-xs">
                {incident.created_at && (
                  <div className="font-medium">
                    {format(
                      new Date(incident.created_at),
                      "LLL dd, y HH:mm:ss"
                    )}
                  </div>
                )}
                <span className="truncate font-normal text-red-800 dark:text-red-50">
                  {incident.error_message}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <IncidentTimeline incident={incident} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
