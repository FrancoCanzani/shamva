import DashboardHeader from "@/frontend/components/dashboard-header";
import NoDataMessage from "@/frontend/components/no-data-message";
import { Collector } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceSlug/collectors";
import { useState } from "react";
import CollectorsTable from "./collectors/collectors-table";
import FloatingActions from "./collectors/floating-actions";

export default function CollectorsPage() {
  const collectorsData = Route.useLoaderData();
  const [selectedCollectors, setSelectedCollectors] = useState<Collector[]>([]);

  const handleSelectionChange = () => {
    setSelectedCollectors([]);
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title={`Dashboard / Collectors`}></DashboardHeader>

      <main className="relative flex-1 overflow-auto">
        <div className="mx-auto h-full max-w-4xl flex-1 space-y-8 overflow-auto p-6">
          {collectorsData.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium">Collectors</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Collectors gather system metrics from your servers and devices.
              </p>
            </div>
          )}

          {collectorsData.length > 0 ? (
            <CollectorsTable
              collectors={collectorsData}
              onSelectionChange={(selectedCollectors) =>
                setSelectedCollectors(selectedCollectors)
              }
            />
          ) : (
            <NoDataMessage
              title="Collectors"
              description="Collectors gather system metrics from your servers and devices. Install the Shamva agent on your infrastructure to start monitoring system resources like CPU, memory, disk usage, and network performance."
              primaryAction={{
                label: "New Collector",
                to: "/dashboard/$workspaceSlug/collectors/new",
              }}
              secondaryAction={{
                label: "Documentation",
                href: "https://docs.shamva.io/collectors",
              }}
            />
          )}
        </div>

        {collectorsData.length > 0 && (
          <FloatingActions
            selectedCollectors={selectedCollectors}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </main>
    </div>
  );
}
