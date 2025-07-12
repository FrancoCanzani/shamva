import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { useMemo, useState } from "react";
import DashboardHeader from "../dashboard-header";
import MonitorTypeSelector from "../monitor/monitor-type-selector";
import { MonitorsGrid } from "../monitors/monitors-grid";
import NotFoundMessage from "../not-found-message";
import { Input } from "../ui/input";

export default function MonitorsPage() {
  const monitorsData = Route.useLoaderData();

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
    <div className="flex h-full flex-col">
      <DashboardHeader>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search monitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-64 rounded text-sm"
          />
          <MonitorTypeSelector />
        </div>
      </DashboardHeader>

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h2 className="text-xl font-medium">Monitors</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              A Monitor is a silent vigilante of your services
            </p>
          </div>

          {filteredMonitors && filteredMonitors.length > 0 ? (
            <div className="flex-1">
              <MonitorsGrid monitors={filteredMonitors} />
            </div>
          ) : searchQuery ? (
            <NotFoundMessage
              message={`No monitors found matching "${searchQuery}".`}
            />
          ) : (
            <NotFoundMessage message="No monitors found. Create one to get started." />
          )}
        </div>
      </main>
    </div>
  );
}
