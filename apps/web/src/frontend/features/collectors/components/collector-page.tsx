import DashboardHeader from "@/frontend/components/dashboard-header";
import NotFoundMessage from "@/frontend/components/not-found-message";
import { Badge } from "@/frontend/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { cn } from "@/frontend/lib/utils";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/collectors/$id";
import { useNavigate } from "@tanstack/react-router";
import AreaChartFillByValue from "./collector/area-chart-fill-by-value";
import CollectorHeader from "./collector/collector-header";
import CollectorStats from "./collector/collector-stats";

const PERIOD_OPTIONS = [
  { value: 1, label: "Last day" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
];

export default function CollectorPage() {
  const collectorData = Route.useLoaderData();
  const { days } = Route.useSearch();
  const navigate = useNavigate();
  const { id, workspaceName } = Route.useParams();

  const handleDaysChange = (newDays: number) => {
    navigate({
      to: "/dashboard/$workspaceName/collectors/$id",
      params: { workspaceName, id },
      search: { days: newDays },
      replace: true,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader
        title={
          !collectorData
            ? "Dashboard / Collectors"
            : `Dashboard / Collectors / ${collectorData.name}`
        }
      >
        <Select
          value={days.toString()}
          onValueChange={(value) => handleDaysChange(parseInt(value))}
        >
          <SelectTrigger size="sm" className="px-2 text-xs data-[size=sm]:h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value.toString()}
                className="text-xs"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DashboardHeader>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 overflow-auto p-6">
        {!collectorData ? (
          <NotFoundMessage message="Collector not found" />
        ) : !collectorData.metrics || collectorData.metrics.length === 0 ? (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {collectorData.name}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    System metrics collector
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={collectorData.is_active ? "default" : "secondary"}
                    className={cn(
                      collectorData.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    )}
                  >
                    {collectorData.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
            <NotFoundMessage message="Your collector doesn't have any metrics yet. Make sure the collector is running and sending data." />
          </>
        ) : (
          <>
            <CollectorHeader
              name={collectorData.name}
              isActive={collectorData.is_active}
              metrics={collectorData.metrics}
            />

            <CollectorStats metrics={collectorData.metrics} />

            <div className="space-y-6">
              <h3 className="text-sm font-medium">
                Historical Data (
                {PERIOD_OPTIONS.find((opt) => opt.value === days)?.label ||
                  `Last ${days} days`}
                )
              </h3>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <AreaChartFillByValue
                  title="CPU Usage"
                  metrics={collectorData.metrics}
                  dataKey="cpu_percent"
                  unit="%"
                  selectedDays={days}
                />
                <AreaChartFillByValue
                  title="Memory Usage"
                  metrics={collectorData.metrics}
                  dataKey="memory_percent"
                  unit="%"
                  selectedDays={days}
                />
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <AreaChartFillByValue
                  title="Disk Usage"
                  metrics={collectorData.metrics}
                  dataKey="disk_percent"
                  unit="%"
                  selectedDays={days}
                />
                <AreaChartFillByValue
                  title="Load Average"
                  metrics={collectorData.metrics}
                  dataKey="load_avg_1"
                  unit=""
                  selectedDays={days}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
