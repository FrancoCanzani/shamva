import { format, parseISO } from "date-fns";
import React from "react";

type TimelineEvent = {
  id: string;
  title: string;
  time: string;
  description?: string;
  color?: string;
};

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  events,
}) => (
  <div className="border rounded-xs shadow-xs w-full lg:w-80 h-fit p-4">
    <h2 className="text-sm font-medium mb-4 font-mono">TIMELINE</h2>
    <div className="flex flex-col items-start justify-start gap-6">
      {events.map((event) => (
        <div key={event.id} className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-xs ${event.color}`}></span>
              <span className="text-xs font-mono text-muted-foreground">
                {format(parseISO(event.time), "HH:mm:ss")}
              </span>
              <span className="font-semibold text-xs font-mono">
                {event.title}
              </span>
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);
