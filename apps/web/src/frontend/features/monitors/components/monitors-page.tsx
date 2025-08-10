import DashboardHeader from "@/frontend/components/dashboard-header";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { Monitor } from "@/frontend/types/types";
import { useMemo, useState } from "react";
import MonitorTypeSelector from "./monitor/monitor-type-selector";
import FloatingActions from "./monitors/floating-actions";
import MonitorsList from "./monitors/monitors-list";
import MonitorsPanel from "./monitors/monitors-panel";

export default function MonitorsPage() {
  const monitorsData = Route.useLoaderData();
  const { selectedId } = Route.useSearch();
  const [selectedMonitors, setSelectedMonitors] = useState<Monitor[]>([]);

  const handleSelectionChange = () => {
    setSelectedMonitors([]);
  };

  const hoveredMonitor = useMemo(
    () => monitorsData?.find((m) => m.id === selectedId),
    [monitorsData, selectedId]
  );

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Monitors" className="border-b">
        <div className="flex items-center space-x-2">
          <MonitorTypeSelector />
        </div>
      </DashboardHeader>

      <main className="relative flex-1 overflow-auto">
        <div className="mx-auto h-max max-w-5xl flex-1 space-y-8 overflow-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium">Monitors</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              A Monitor is a silent vigilante of your services.
            </p>
          </div>

          <div className="flex h-full flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <MonitorsList
                monitors={monitorsData}
                onSelectionChange={(selectedMonitors) =>
                  setSelectedMonitors(selectedMonitors)
                }
              />
            </div>

            <aside className="hidden w-full shrink-0 md:block lg:w-[360px]">
              <MonitorsPanel monitor={hoveredMonitor} />
            </aside>
          </div>
        </div>

        <FloatingActions
          selectedMonitors={selectedMonitors}
          onSelectionChange={handleSelectionChange}
        />
      </main>
    </div>
  );
}
