import DashboardHeader from "@/frontend/components/dashboard-header";
import NoDataMessage from "@/frontend/components/no-data-message";
import { Route } from "@/frontend/routes/dashboard/$workspaceSlug/monitors";
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
    <>
      <DashboardHeader>
        <MonitorTypeSelector />
      </DashboardHeader>

      <main className="w-full flex-1">
        <div className="mx-auto h-full max-w-4xl space-y-8 overflow-auto p-6">
          {monitorsData.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium">Monitors</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                A Monitor is a silent vigilante of your services.
              </p>
            </div>
          )}

          {monitorsData.length > 0 ? (
            <MonitorsTable
              monitors={monitorsData}
              onSelectionChange={(selectedMonitors) =>
                setSelectedMonitors(selectedMonitors)
              }
            />
          ) : (
            <NoDataMessage
              title="Monitors"
              description="A Monitor is a silent vigilante of your services. Create HTTP, TCP, or other types of monitors to keep track of your applications and receive alerts when they go down."
              primaryAction={{
                label: "New Monitor",
                to: "/dashboard/$workspaceSlug/monitors/new",
              }}
              secondaryAction={{
                label: "Documentation",
                href: "https://docs.shamva.io/monitors",
              }}
            />
          )}
        </div>

        {monitorsData.length > 0 && (
          <FloatingActions
            selectedMonitors={selectedMonitors}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </main>
    </>
  );
}
