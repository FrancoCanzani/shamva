import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { MonitorsCards } from "../monitors/monitors-cards";
import NotFoundMessage from "../not-found-message";
import { Button } from "../ui/button";
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
    <div className="p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-xl">Monitors</h2>
          <p className="text-sm text-muted-foreground mt-1">
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
          <Button asChild variant={"outline"} size={"xs"}>
            <Link
              to="/dashboard/$workspaceName/monitors/new"
              params={{ workspaceName: workspaceName }}
            >
              New Monitor
            </Link>
          </Button>
        </div>
      </div>
      {filteredMonitors && filteredMonitors.length > 0 ? (
        <MonitorsCards monitors={filteredMonitors} workspaceName={workspaceName} />
      ) : searchQuery ? (
        <NotFoundMessage message={`No monitors found matching "${searchQuery}".`} />
      ) : (
        <NotFoundMessage message="No monitors found. Create one to get started." />
      )}
    </div>
  );
}
