import { cn } from "@/frontend/lib/utils";
import type { Dispatch, SetStateAction } from "react";
import { FormState } from "../pages/new-monitor-page";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const checkIntervals = [
  { value: "60000", label: "1 minute" },
  { value: "300000", label: "5 minutes" },
  { value: "600000", label: "10 minutes" },
  { value: "900000", label: "15 minutes" },
  { value: "1800000", label: "30 minutes" },
  { value: "3600000", label: "1 hour" },
];

interface BasicConfigSectionProps {
  formData: FormState;
  setFormData: Dispatch<SetStateAction<FormState>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
}

export function BasicConfigSection({
  formData,
  setFormData,
  errors,
  setErrors,
}: BasicConfigSectionProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleIntervalChange = (value: string) => {
    setFormData((prev) => ({ ...prev, interval: parseInt(value, 10) }));

    if (errors.interval) {
      setErrors((prev) => ({ ...prev, interval: "" }));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Basic Configuration</h2>
      <div className="flex items-start justify-start gap-2">
        <div className="space-y-2 flex-1">
          <Label htmlFor="name">Monitor name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Example API"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2 w-[150px]">
          <Label htmlFor="interval">Check interval</Label>
          <Select
            onValueChange={handleIntervalChange}
            value={formData.interval.toString()}
          >
            <SelectTrigger
              id="interval"
              className={cn(
                "w-full",
                errors.interval ? "border-destructive" : "",
              )}
            >
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {checkIntervals.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.interval && (
            <p className="text-sm text-destructive">{errors.interval}</p>
          )}
        </div>
      </div>
    </div>
  );
}
