import { monitoringRegions } from "@/frontend/utils/constants";
import { cn } from "@/frontend/utils/utils";
import { Check } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

const regionsByContinent = monitoringRegions.reduce(
  (acc, region) => {
    if (!acc[region.continent]) acc[region.continent] = [];
    acc[region.continent].push(region);
    return acc;
  },
  {} as Record<string, typeof monitoringRegions>
);

const continentOrder = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Middle East",
  "Asia-Pacific",
  "Oceania",
];

const ErrorMessage = ({ errors }: { errors?: string }) =>
  errors ? <p className="text-destructive text-sm">{errors}</p> : null;

export function MonitorFormRegionsSection() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();
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
                <span className="text-muted-foreground text-xs">
                  {selectedRegions.length} region
                  {selectedRegions.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                * Regions are a best effort and not a guarantee. Monitors will
                not necessarily be instantiated in the hinted region, but
                instead instantiated in a data center selected to minimize
                latency.
              </p>
            </div>

            <div className="border border-dashed p-2">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {continentOrder.map((continent) => {
                  const regions = regionsByContinent[continent] || [];
                  if (regions.length === 0) return null;

                  return (
                    <div key={continent} className="space-y-2">
                      <h3 className="text-sm font-medium">{continent}</h3>
                      <div className="grid gap-2">
                        {regions.map((region) => {
                          const isSelected = field.value.includes(region.value);
                          return (
                            <div
                              key={region.value}
                              className={cn(
                                "flex cursor-pointer items-center justify-between border p-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800",
                                isSelected
                                  ? "border-primary bg-stone-50 dark:bg-stone-800"
                                  : ""
                              )}
                              onClick={() => {
                                const newRegions = isSelected
                                  ? field.value.filter(
                                      (r: string) => r !== region.value
                                    )
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
                                    ? field.value.filter(
                                        (r: string) => r !== region.value
                                      )
                                    : [...field.value, region.value];
                                  field.onChange(newRegions);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm leading-none">
                                  {region.flag}
                                </span>
                                <span className="text-xs">{region.label}</span>
                              </div>
                              {isSelected && (
                                <Check className="text-primary h-4 w-4" />
                              )}
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
