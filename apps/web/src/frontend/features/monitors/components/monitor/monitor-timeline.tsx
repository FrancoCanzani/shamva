import NotFoundMessage from "@/frontend/components/not-found-message";
import { format, parseISO } from "date-fns";
import {
  Bell,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  ServerCrash,
} from "lucide-react";
import { useState } from "react";
import { MonitorWithIncidents } from "../../types";

interface MonitorTimelineProps {
  monitor: MonitorWithIncidents;
}

const iconMap = new Map([
  ["incident_start", ServerCrash],
  ["acknowledged", Eye],
  ["resolved", CheckCircle],
  ["notification", Bell],
  ["monitor_created", Plus],
]);

export function MonitorTimeline({ monitor }: MonitorTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const allEvents: { title: string; timestamp: string; type: string }[] = [];

  if (monitor?.created_at) {
    allEvents.push({
      title: "Monitor created",
      timestamp: monitor.created_at,
      type: "monitor_created",
    });
  }

  const incidents = monitor?.incidents || [];

  incidents.forEach((incident) => {
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

    incidentEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    allEvents.push(...incidentEvents);
  });

  const sortedEvents = allEvents.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Timeline</h3>
        <NotFoundMessage message="No timeline events found" />
      </div>
    );
  }

  const INITIAL_DISPLAY_COUNT = 5;
  const displayedEvents = showAll
    ? sortedEvents
    : sortedEvents.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreEvents = sortedEvents.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Timeline</h3>
        <span className="text-muted-foreground text-xs">
          {sortedEvents.length} events
        </span>
      </div>

      <div className="divide-y divide-dashed">
        {displayedEvents.map((event, index) => {
          const Icon = iconMap.get(event.type) || CheckCircle;

          return (
            <div
              key={index}
              className="hover:bg-input/20 flex w-full items-center justify-between px-1 py-2"
            >
              <div className="flex items-center justify-start gap-2">
                <Icon className="h-3 w-3 grayscale" />
                <h4 className="text-sm">{event.title}</h4>
              </div>
              <time className="text-muted-foreground font-mono text-xs tracking-tighter whitespace-nowrap">
                {format(parseISO(event.timestamp), "MMM d, HH:mm")}
              </time>
            </div>
          );
        })}
      </div>

      {hasMoreEvents && (
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-primary mx-auto flex items-center justify-center gap-2 text-xs"
          >
            {showAll ? (
              <>
                Show less <ChevronUp className="size-3" />
              </>
            ) : (
              <>
                Show {sortedEvents.length - INITIAL_DISPLAY_COUNT} more events{" "}
                <ChevronDown className="size-3" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
