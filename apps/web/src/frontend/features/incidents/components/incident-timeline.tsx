import { format, parseISO } from "date-fns";
import { TimelineEvent } from "../types";

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

export default function IncidentTimeline({ events }: IncidentTimelineProps) {
  return (
    <div className="rounded border p-4">
      <div className="mb-4">
        <span className="text-sm font-medium">Timeline</span>
      </div>
      
      <div className="space-y-3 divide-y divide-dashed">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3 pt-3 first:pt-0">
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{event.title}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {format(parseISO(event.time), "HH:mm:ss")}
                </span>
              </div>
              {event.description && (
                <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
