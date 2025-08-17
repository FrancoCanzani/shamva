import DashboardHeader from "@/frontend/components/dashboard-header";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { useState } from "react";
import { MonitorWithMetrics } from "../types";
import MonitorTypeSelector from "./monitor/monitor-type-selector";
import FloatingActions from "./monitors/floating-actions";
import MonitorsTable from "./monitors/monitors-table";

export default function MonitorsPage() {
  const monitorsData = Route.useLoaderData();
  const [selectedMonitors, setSelectedMonitors] = useState<
    MonitorWithMetrics[]
  >([]);

  const handleSelectionChange = () => {
    setSelectedMonitors([]);
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title={`Dashboard / Monitors`}>
        <MonitorTypeSelector />
      </DashboardHeader>

      <main className="relative flex-1 overflow-auto">
        <div className="mx-auto h-max max-w-4xl flex-1 space-y-8 overflow-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium">Monitors</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              A Monitor is a silent vigilante of your services.
            </p>
          </div>

          <MonitorsTable
            monitors={monitorsData}
            onSelectionChange={(selectedMonitors) =>
              setSelectedMonitors(selectedMonitors)
            }
          />
        </div>

        <FloatingActions
          selectedMonitors={selectedMonitors}
          onSelectionChange={handleSelectionChange}
        />
      </main>
    </div>
  );
}
