import { monitoringRegions } from "@/frontend/lib/constants";
import { cn } from "@/frontend/lib/utils";
import { Controller, useFormContext } from "react-hook-form";
import { Check } from "lucide-react";

const regionsByContinent = monitoringRegions.reduce(
  (acc, region) => {
    if (!acc[region.continent]) acc[region.continent] = [];
    acc[region.continent].push(region);
    return acc;
  },
  {} as Record<string, typeof monitoringRegions>
);

const continentOrder = ["North America", "South America", "Europe", "Africa", "Middle East", "Asia-Pacific", "Oceania"];

const ErrorMessage = ({ errors }: { errors?: string }) => 
  errors ? <p className="text-sm text-destructive">{errors}</p> : null;

export function MonitorFormRegionsSection() {
  const { control, watch, formState: { errors } } = useFormContext();
  const selectedRegions = watch("regions");

  return (
    <div id="monitoring-regions" className="space-y-4">
      <Controller
        control={control}
        name="regions"
        render={({ field }) => (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Monitoring Regions *</h2>
                <span className="text-xs text-muted-foreground">
                  {selectedRegions.length} region{selectedRegions.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                * Regions are a best effort and not a guarantee. Monitors will not necessarily be instantiated 
                in the hinted region, but instead instantiated in a data center selected to minimize latency.
              </p>
            </div>

            <div className="border border-dashed p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {continentOrder.map((continent) => {
                  const regions = regionsByContinent[continent] || [];
                  if (regions.length === 0) return null;

                  return (
                    <div key={continent} className="space-y-2">
                      <h3 className="font-medium text-sm">{continent}</h3>
                      <div className="grid gap-2">
                        {regions.map((region) => {
                          const isSelected = field.value.includes(region.value);
                          return (
                            <div
                              key={region.value}
                              className={cn(
                                "flex items-center justify-between p-2 border cursor-pointer hover:bg-carbon-50 dark:hover:bg-carbon-800 transition-colors",
                                isSelected ? "border-primary bg-carbon-50 dark:bg-carbon-800" : ""
                              )}
                              onClick={() => {
                                const newRegions = isSelected
                                  ? field.value.filter((r: string) => r !== region.value)
                                  : [...field.value, region.value];
                                field.onChange(newRegions);
                              }}
                              role="checkbox"
                              aria-checked={isSelected}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === " " || e.key === "Enter") {
                                  e.preventDefault();
                                  const newRegions = isSelected
                                    ? field.value.filter((r: string) => r !== region.value)
                                    : [...field.value, region.value];
                                  field.onChange(newRegions);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm leading-none">{region.flag}</span>
                                <span className="text-xs">{region.label}</span>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <ErrorMessage errors={errors.regions?.message?.toString()} />
          </>
        )}
      />
    </div>
  );
} 