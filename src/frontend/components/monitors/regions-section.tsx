import { monitoringRegions } from "@/frontend/lib/constants";
import { Check } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { FormState } from "../pages/new-monitor-page";

const regionsByContinent = monitoringRegions.reduce(
  (acc, region) => {
    if (!acc[region.continent]) {
      acc[region.continent] = [];
    }
    acc[region.continent].push(region);
    return acc;
  },
  {} as Record<string, typeof monitoringRegions>,
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

interface RegionsMapProps {
  selectedRegions: string[];
  setFormData: Dispatch<SetStateAction<FormState>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

export function RegionsSection({
  selectedRegions,
  setFormData,
  errors,
  setErrors,
}: RegionsMapProps) {
  const toggleRegion = (regionValue: string) => {
    setFormData((prev) => {
      const isSelected = prev.regions.includes(regionValue);
      const newRegions = isSelected
        ? prev.regions.filter((value) => value !== regionValue)
        : [...prev.regions, regionValue];

      // Enforce selecting at least one region
      if (newRegions.length === 0) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          regions: "Please select at least one monitoring region.",
        }));
        // Optionally, prevent deselection if it's the last one,
        // or just show the error and let the state update.
        // For this example, we allow deselection but show error.
      } else if (errors.regions) {
        // Clear error if regions are now valid
        setErrors((prevErrors) => ({ ...prevErrors, regions: "" }));
      }

      return { ...prev, regions: newRegions };
    });

    // This immediate check might conflict with the state update logic above.
    // It's better handled within the setFormData callback or useEffect.
    // We already handle error clearing/setting within setFormData.
    // if (errors.regions) {
    //   setErrors((prev) => ({ ...prev, regions: "" }));
    // }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Monitoring Regions</h2>
        <span className="text-sm text-muted-foreground">
          {selectedRegions.length} region
          {selectedRegions.length !== 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="border rounded-sm p-4 bg-slate/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {continentOrder.map((continent) => {
            const regions = regionsByContinent[continent] || [];
            if (regions.length === 0) return null; // Don't render section if no regions for continent
            return (
              <ContinentSection
                key={continent}
                continent={continent}
                regions={regions}
                selectedRegions={selectedRegions}
                toggleRegion={toggleRegion}
              />
            );
          })}
        </div>
      </div>

      {errors.regions && (
        <p className="text-sm text-destructive">{errors.regions}</p>
      )}
    </div>
  );
}

interface ContinentSectionProps {
  continent: string;
  regions: typeof monitoringRegions;
  selectedRegions: string[];
  toggleRegion: (regionValue: string) => void;
}

function ContinentSection({
  continent,
  regions,
  selectedRegions,
  toggleRegion,
}: ContinentSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">{continent}</h3>
      <div className="grid gap-2">
        {regions.map((region) => (
          <RegionItem
            key={region.value}
            region={region}
            isSelected={selectedRegions.includes(region.value)}
            toggleRegion={toggleRegion}
          />
        ))}
      </div>
    </div>
  );
}

interface RegionItemProps {
  region: (typeof monitoringRegions)[0];
  isSelected: boolean;
  toggleRegion: (regionValue: string) => void;
}

function RegionItem({ region, isSelected, toggleRegion }: RegionItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 border rounded-sm cursor-pointer hover:bg-slate-50 transition-colors ${
        isSelected ? "border-primary bg-slate-50" : ""
      }`}
      onClick={() => toggleRegion(region.value)}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggleRegion(region.value);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none">{region.flag}</span>
        <span className="text-sm">{region.label}</span>
      </div>
      {isSelected && <Check className="h-4 w-4 text-primary" />}
    </div>
  );
}
