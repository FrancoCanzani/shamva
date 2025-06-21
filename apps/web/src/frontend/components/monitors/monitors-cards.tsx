import type { Monitor } from "@/frontend/lib/types";
import MonitorsCard from "./monitors-card";

interface MonitorsCardsProps {
  monitors: Monitor[];
  workspaceName: string;
}

export function MonitorsCards({ monitors, workspaceName }: MonitorsCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {monitors.map((monitor) => (
        <MonitorsCard key={monitor.id} monitor={monitor} workspaceName={workspaceName} />
      ))}
    </div>
  );
} 