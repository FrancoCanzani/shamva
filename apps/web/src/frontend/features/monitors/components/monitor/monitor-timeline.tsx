import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/frontend/components/ui/accordion";
import { Incident } from "@/frontend/types/types";
import { getRegionNameFromCode } from "@/frontend/utils/utils";
import { Link, useParams } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";

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
  const { workspaceName } = useParams({ strict: false });

  const events: { title: string; timestamp: string; details: string | null }[] =
    [];

  if (incident.started_at) {
    events.push({
      title: "Incident started",
      timestamp: incident.started_at,
      details: incident.regions_affected?.length
        ? `Regions: ${incident.regions_affected
            .map((code) => getRegionNameFromCode(code))
            .join(", ")}`
        : null,
    });
  }

  if (incident.notified_at) {
    events.push({
      title: "Notifications sent",
      timestamp: incident.notified_at,
      details: null,
    });
  }

  if (incident.acknowledged_at) {
    events.push({
      title: "Incident acknowledged",
      timestamp: incident.acknowledged_at,
      details: null,
    });
  }

  if (incident.resolved_at) {
    events.push({
      title: "Incident resolved",
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
        <span className="text-xs font-medium">Timeline</span>
        <Link
          to="/dashboard/$workspaceName/incidents/$id"
          params={{
            workspaceName: workspaceName!,
            id: incident.id!,
          }}
          className="text-primary inline-flex h-auto items-center gap-1 p-0 text-xs hover:underline"
        >
          View Details <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="space-y-3 divide-y divide-dashed">
        {events.map((event, index) => (
          <div key={index} className="flex gap-3 text-xs">
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <span>{event.title}</span>
                <span className="text-muted-foreground text-xs">
                  {format(parseISO(event.timestamp), "MMM d, HH:mm")}
                </span>
              </div>
              {event.details && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {event.details}
                </p>
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
        <h3 className="text-sm font-medium">Incidents</h3>
        <div className="rounded border border-dashed p-4 text-center">
          <div className="text-muted-foreground text-xs">
            No incidents found
          </div>
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
        <h3 className="text-sm font-medium">Incidents</h3>
        <span className="text-muted-foreground text-xs">
          {incidents.length} total
        </span>
      </div>

      <Accordion type="single" collapsible>
        {sortedIncidents.map((incident) => (
          <AccordionItem key={incident.id} value={incident.id!}>
            <AccordionTrigger className="text-left">
              <div className="flex w-full min-w-0 items-center space-x-1.5 text-xs">
                {incident.created_at && (
                  <div className="shrink-0 font-medium">
                    {format(
                      new Date(incident.created_at),
                      "LLL dd, y HH:mm:ss"
                    )}
                  </div>
                )}
                <span className="flex-1 truncate font-normal text-red-800 dark:text-red-50">
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
