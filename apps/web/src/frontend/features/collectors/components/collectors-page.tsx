import DashboardHeader from "@/frontend/components/dashboard-header";
import { Route } from "@/frontend/routes/dashboard/$workspaceSlug/collectors";
import { useState } from "react";
import { Collector } from "@/frontend/lib/types";
import FloatingActions from "./collectors/floating-actions";
import CollectorsTable from "./collectors/collectors-table";

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
        <div className="mx-auto h-max max-w-4xl flex-1 space-y-8 overflow-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium">Collectors</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Collectors gather system metrics from your servers and devices.
            </p>
          </div>

          <CollectorsTable
            collectors={collectorsData}
            onSelectionChange={(selectedCollectors) =>
              setSelectedCollectors(selectedCollectors)
            }
          />
        </div>

        <FloatingActions
          selectedCollectors={selectedCollectors}
          onSelectionChange={handleSelectionChange}
        />
      </main>
    </div>
  );
}
