import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { useMemo, useState } from "react";
import MonitorTypeSelector from "../monitor/monitor-type-selector";
import { MonitorsCards } from "../monitors/monitors-cards";
import NotFoundMessage from "../not-found-message";
import { Input } from "../ui/input";

export default function MonitorsPage() {
  const monitorsData = Route.useLoaderData();
  const { workspaceName } = Route.useParams();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMonitors = useMemo(() => {
    if (!monitorsData) return [];
    if (!searchQuery.trim()) return monitorsData;

    return monitorsData.filter((monitor) => {
      const searchLower = searchQuery.toLowerCase();
      const name = monitor.name?.toLowerCase() || "";
      const url = monitor.url?.toLowerCase() || "";

      return name.includes(searchLower) || url.includes(searchLower);
    });
  }, [monitorsData, searchQuery]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Monitors</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            A Monitor is a silent vigilante of your services
          </p>
        </div>
        <div className="flex items-center space-x-1.5">
          <Input
            placeholder="Search monitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs placeholder:text-xs"
          />
          <MonitorTypeSelector />
        </div>
      </div>
      {filteredMonitors && filteredMonitors.length > 0 ? (
        <MonitorsCards
          monitors={filteredMonitors}
          workspaceName={workspaceName}
        />
      ) : searchQuery ? (
        <NotFoundMessage
          message={`No monitors found matching "${searchQuery}".`}
        />
      ) : (
        <NotFoundMessage message="No monitors found. Create one to get started." />
      )}
    </div>
  );
}
