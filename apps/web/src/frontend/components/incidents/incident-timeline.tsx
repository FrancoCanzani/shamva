import { format, parseISO } from "date-fns";

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

export default function IncidentTimeline({ events }: IncidentTimelineProps) {
  return (
    <div className="h-fit w-full rounded-xs border p-4 shadow-xs lg:w-80">
      <h2 className="mb-4 font-mono text-sm font-medium">Timeline</h2>
      <div className="relative">
        <div className="bg-carbon-50 absolute top-0 bottom-0 left-1 w-0.5"></div>

        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div key={event.id} className="relative flex items-start gap-2">
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={`h-2.5 w-2.5 rounded-xs shadow-xs ${event.color || "bg-blue-500"} shadow-sm`}
                ></div>
              </div>

              <div className="min-w-0 flex-1 pb-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs">
                    {format(parseISO(event.time), "HH:mm:ss")}
                  </span>
                  <span className="font-mono text-xs font-medium">
                    {event.title}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
