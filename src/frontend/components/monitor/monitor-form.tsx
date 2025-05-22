import { monitoringRegions } from "@/frontend/lib/constants";
import { MonitorFormSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Check } from "lucide-react";
import { z } from "zod";
import { Button } from "../ui/button";
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
import { Textarea } from "../ui/textarea";

const checkIntervals = [
  { value: "60000", label: "1 minute" },
  { value: "300000", label: "5 minutes" },
  { value: "600000", label: "10 minutes" },
  { value: "900000", label: "15 minutes" },
  { value: "1800000", label: "30 minutes" },
  { value: "3600000", label: "1 hour" },
];

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

export type MonitorFormValues = z.infer<typeof MonitorFormSchema>;

interface MonitorFormProps {
  initialValues?: Partial<MonitorFormValues>;
  onSubmit: (values: MonitorFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export default function MonitorForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: MonitorFormProps) {
  const defaultValues: MonitorFormValues = {
    name: "",
    url: "",
    method: "GET",
    interval: 60000,
    regions: [],
    headersString: "",
    bodyString: "",
    ...initialValues,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        console.error("Error submitting form:", error);
        throw error;
      }
    },
    validators: {
      onChange: ({ value }) => {
        try {
          MonitorFormSchema.parse(value);
          return undefined;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string> = {};
            error.errors.forEach((err) => {
              const path = err.path.join(".");
              fieldErrors[path] = err.message;
            });

            return {
              fields: fieldErrors,
            };
          }
          return { form: "Invalid form data" };
        }
      },
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <h2 className="font-medium">Basic Configuration</h2>
        <div className="flex items-start justify-start gap-2">
          <div className="space-y-2 flex-1">
            <form.Field name="name">
              {(field) => (
                <>
                  <Label htmlFor="name">Monitor name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Example API"
                    className={
                      field.state.meta.errors?.length
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {field.state.meta.errors?.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </>
              )}
            </form.Field>
          </div>

          <div className="space-y-2 w-[150px]">
            <form.Field name="interval">
              {(field) => (
                <>
                  <Label htmlFor="interval">Check interval</Label>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(parseInt(value, 10))
                    }
                    value={field.state.value.toString()}
                    onOpenChange={() => {
                      if (!field.state.meta.isTouched) {
                        field.handleBlur();
                      }
                    }}
                  >
                    <SelectTrigger
                      id="interval"
                      className={cn(
                        "w-full",
                        field.state.meta.errors?.length
                          ? "border-destructive"
                          : "",
                      )}
                    >
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {checkIntervals.map((interval) => (
                          <SelectItem
                            key={interval.value}
                            value={interval.value}
                          >
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </>
              )}
            </form.Field>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Request Configuration</h2>
        <div className="flex items-baseline justify-start gap-2">
          <div className="space-y-2">
            <form.Field name="method">
              {(field) => (
                <>
                  <Label htmlFor="method">Method</Label>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(value as "GET" | "POST" | "HEAD")
                    }
                    value={field.state.value}
                    onOpenChange={() => {
                      if (!field.state.meta.isTouched) {
                        field.handleBlur();
                      }
                    }}
                  >
                    <SelectTrigger
                      id="method"
                      className={
                        field.state.meta.errors?.length
                          ? "border-destructive"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </>
              )}
            </form.Field>
          </div>

          <div className="space-y-2 flex-1">
            <form.Field name="url">
              {(field) => (
                <>
                  <Label htmlFor="url">URL to Monitor</Label>
                  <Input
                    id="url"
                    name="url"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="https://example.com/api"
                    className={
                      field.state.meta.errors?.length
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {field.state.meta.errors?.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </>
              )}
            </form.Field>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <form.Field name="regions">
          {(field) => (
            <>
              <div className="flex gap-1.5 flex-col items-center justify-between">
                <div className="flex w-full items-center justify-between">
                  <h2 className="font-medium">Monitoring Regions *</h2>

                  <span className="text-sm text-muted-foreground">
                    {field.state.value.length} region
                    {field.state.value.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Regions are a best effort and not a guarantee. Monitors will
                  not necessarily be instantiated in the hinted region, but
                  instead instantiated in a data center selected to minimize
                  latency.
                </p>
              </div>

              <div className="border rounded border-dashed p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {continentOrder.map((continent) => {
                    const regions = regionsByContinent[continent] || [];
                    if (regions.length === 0) return null;

                    return (
                      <div key={continent} className="space-y-2">
                        <h3 className="font-medium text-sm">{continent}</h3>
                        <div className="grid gap-2">
                          {regions.map((region) => {
                            const isSelected = field.state.value.includes(
                              region.value,
                            );

                            return (
                              <div
                                key={region.value}
                                className={`flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-slate-50 transition-colors ${
                                  isSelected ? "border-primary bg-slate-50" : ""
                                }`}
                                onClick={() => {
                                  const newRegions = isSelected
                                    ? field.state.value.filter(
                                        (r) => r !== region.value,
                                      )
                                    : [...field.state.value, region.value];
                                  field.handleChange(newRegions);
                                }}
                                role="checkbox"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === " " || e.key === "Enter") {
                                    e.preventDefault();
                                    const newRegions = isSelected
                                      ? field.state.value.filter(
                                          (r) => r !== region.value,
                                        )
                                      : [...field.state.value, region.value];
                                    field.handleChange(newRegions);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm leading-none">
                                    {region.flag}
                                  </span>
                                  <span className="text-xs">
                                    {region.label}
                                  </span>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
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

              {field.state.meta.errors?.length > 0 && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </>
          )}
        </form.Field>
      </div>

      <div className="space-y-4">
        <h2 className="font-medium">Advanced Options</h2>

        <div className="space-y-4 border rounded border-dashed p-4 bg-slate-50/10">
          <div className="space-y-2">
            <form.Field name="headersString">
              {(field) => (
                <>
                  <Label htmlFor="headersString">Headers (JSON String)</Label>
                  <Textarea
                    id="headersString"
                    name="headersString"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    rows={8}
                    className={cn(
                      "text-sm",
                      field.state.meta.errors?.length
                        ? "border-destructive"
                        : "",
                    )}
                  />
                  {field.state.meta.errors?.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter headers as a valid JSON object
                  </p>
                </>
              )}
            </form.Field>
          </div>

          <form.Field name="method">
            {(methodField) =>
              methodField.state.value === "POST" && (
                <div className="space-y-2">
                  <form.Field name="bodyString">
                    {(field) => (
                      <>
                        <Label htmlFor="bodyString">
                          Request Body (JSON String)
                        </Label>
                        <Textarea
                          id="bodyString"
                          name="bodyString"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder='{"key": "value"}'
                          rows={8}
                          className={cn(
                            "text-sm",
                            field.state.meta.errors?.length
                              ? "border-destructive"
                              : "",
                          )}
                        />
                        {field.state.meta.errors?.length > 0 && (
                          <p className="text-sm text-destructive">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Only applicable for POST requests
                        </p>
                      </>
                    )}
                  </form.Field>
                </div>
              )
            }
          </form.Field>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
