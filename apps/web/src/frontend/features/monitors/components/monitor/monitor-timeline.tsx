import { format, parseISO } from "date-fns";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MonitorWithIncidents } from "../../types";

interface MonitorTimelineProps {
  monitor: MonitorWithIncidents;
}

export function MonitorTimeline({ monitor }: MonitorTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const allEvents: { title: string; timestamp: string; type: string }[] = [];

  // Add monitor creation event
  if (monitor?.created_at) {
    allEvents.push({
      title: "Monitor created",
      timestamp: monitor.created_at,
      type: "monitor_created",
    });
  }

  const incidents = monitor?.incidents || [];

  incidents.forEach((incident) => {
    // For each incident, collect its events and sort them logically
    const incidentEvents: { title: string; timestamp: string; type: string }[] =
      [];

    if (incident.started_at) {
      incidentEvents.push({
        title: "Incident started",
        timestamp: incident.started_at,
        type: "incident_start",
      });
    }

    if (incident.notified_at) {
      incidentEvents.push({
        title: "Notifications sent",
        timestamp: incident.notified_at,
        type: "notification",
      });
    }

    if (incident.acknowledged_at) {
      incidentEvents.push({
        title: "Incident acknowledged",
        timestamp: incident.acknowledged_at,
        type: "acknowledged",
      });
    }

    if (incident.resolved_at) {
      incidentEvents.push({
        title: "Incident resolved",
        timestamp: incident.resolved_at,
        type: "resolved",
      });
    }

    // Sort incident events chronologically (oldest first for logical flow)
    incidentEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Add to main events array
    allEvents.push(...incidentEvents);
  });

  const sortedEvents = allEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Timeline</h3>
        <div className="rounded border border-dashed p-4 text-center">
          <div className="text-muted-foreground text-xs">
            No timeline events found
          </div>
        </div>
      </div>
    );
  }

  const INITIAL_DISPLAY_COUNT = 5;
  const displayedEvents = showAll
    ? sortedEvents
    : sortedEvents.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreEvents = sortedEvents.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Timeline</h3>
        <span className="text-muted-foreground text-xs">
          {sortedEvents.length} events
        </span>
      </div>

      <div className="divide-y divide-dashed">
        {displayedEvents.map((event, index) => (
          <div key={index} className="px-1 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">{event.title}</span>
              <span className="text-muted-foreground font-mono text-xs tracking-tighter">
                {format(parseISO(event.timestamp), "MMM d, HH:mm")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasMoreEvents && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1 py-2 text-xs transition-colors"
        >
          {showAll ? (
            <>
              Show less <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Show {sortedEvents.length - INITIAL_DISPLAY_COUNT} more{" "}
              <ChevronDown className="size-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
