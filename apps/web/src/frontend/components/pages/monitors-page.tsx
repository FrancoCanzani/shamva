import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import DashboardHeader from "../dashboard-header";
import MonitorTypeSelector from "../monitor/monitor-type-selector";
import MonitorsTable from "../monitors/monitors-table";

export default function MonitorsPage() {
  const monitorsData = Route.useLoaderData();

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader>
        <div className="flex items-center space-x-2">
          <MonitorTypeSelector />
        </div>
      </DashboardHeader>

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h2 className="text-xl font-medium">Monitors</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              A Monitor is a silent vigilante of your services
            </p>
          </div>

          <MonitorsTable monitors={monitorsData} />
        </div>
      </main>
    </div>
  );
}
