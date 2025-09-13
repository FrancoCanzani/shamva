import { Button } from "@/frontend/components/ui/button";
import { ErrorMessage } from "@/frontend/components/ui/form-error-message";
import { FormField } from "@/frontend/components/ui/form-field";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { monitoringRegions } from "@/frontend/lib/constants";
import { TcpMonitorSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Check } from "lucide-react";
import { z } from "zod";

const checkIntervals = [
  { value: "60000", label: "1 minute" },
  { value: "300000", label: "5 minutes" },
  { value: "600000", label: "10 minutes" },
  { value: "900000", label: "15 minutes" },
  { value: "1800000", label: "30 minutes" },
  { value: "3600000", label: "1 hour" },
];

export type TcpMonitorFormValues = z.infer<typeof TcpMonitorSchema>;

interface TcpMonitorFormProps {
  onSubmit: (values: {
    name: string;
    checkType: "tcp";
    tcpHostPort: string;
    interval: number;
    regions: string[];
    slackWebhookUrl?: string;
    degradedThresholdMs?: number;
    timeoutThresholdMs?: number;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<{
    name: string;
    tcpHostPort: string;
    interval: number;
    regions: string[];
    degradedThresholdMs?: number;
    timeoutThresholdMs?: number;
  }>;
}

export default function TcpMonitorForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Save",
  defaultValues,
}: TcpMonitorFormProps) {
  const defaultFormValues: TcpMonitorFormValues = {
    name: defaultValues?.name || "",
    tcpHostPort: defaultValues?.tcpHostPort || "",
    interval: defaultValues?.interval ?? 300000,
    regions: defaultValues?.regions ?? [],
    degradedThresholdMs: defaultValues?.degradedThresholdMs,
    timeoutThresholdMs: defaultValues?.timeoutThresholdMs,
  };

  const form = useForm({
    defaultValues: defaultFormValues,
    validators: {
      onChange: ({ value }) => {
        const result = TcpMonitorSchema.safeParse(value);
        if (result.success) return undefined;

        const fieldErrors: Record<string, string> = {};

        for (const issue of result.error.issues) {
          const path = issue.path.join(".");
          if (path && !fieldErrors[path]) {
            fieldErrors[path] = issue.message;
          }
        }
        return { fields: fieldErrors };
      },
    },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name,
        checkType: "tcp" as const,
        tcpHostPort: value.tcpHostPort,
        interval: value.interval,
        regions: value.regions,
        slackWebhookUrl: value.slackWebhookUrl,
        degradedThresholdMs: value.degradedThresholdMs,
        timeoutThresholdMs: value.timeoutThresholdMs,
      };

      await onSubmit(payload);
    },
  });

  return (
    <div className="flex gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex-1 space-y-8"
      >
        <div id="basic-config" className="space-y-4">
          <h2 className="font-medium">Basic Configuration</h2>
          <div className="flex w-full gap-4">
            <FormField className="w-full flex-1">
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
                      placeholder="Database Connection"
                      className={cn(
                        "w-full",
                        field.state.meta.errors?.length && "border-destructive"
                      )}
                    />
                    {field.state.meta.errors?.length > 0 && (
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                  </>
                )}
              </form.Field>
            </FormField>

            <FormField>
              <form.Field name="interval">
                {(field) => (
                  <>
                    <Label htmlFor="interval">Check interval</Label>
                    <Select
                      onValueChange={(value) =>
                        field.handleChange(Number.parseInt(value, 10))
                      }
                      value={field.state.value.toString()}
                    >
                      <SelectTrigger
                        id="interval"
                        className={
                          field.state.meta.errors?.length
                            ? "border-destructive"
                            : ""
                        }
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
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                  </>
                )}
              </form.Field>
            </FormField>
          </div>

          <form.Subscribe
            selector={(state) => ({
              interval: state.values.interval,
              regions: state.values.regions,
            })}
          >
            {({ interval, regions }) => {
              const checksPerDay =
                interval > 0
                  ? Math.round(
                      ((24 * 60 * 60 * 1000) / interval) * (regions.length || 1)
                    )
                  : 0;

              return (
                <div className="text-muted-foreground text-sm">
                  <span className="font-medium">Checks per day:</span>{" "}
                  {checksPerDay.toLocaleString()}
                  <span className="ml-1 text-xs">
                    ({regions.length || 1} region
                    {(regions.length || 1) !== 1 ? "s" : ""} ×{" "}
                    {Math.round((24 * 60 * 60 * 1000) / interval)} checks/day)
                  </span>
                </div>
              );
            }}
          </form.Subscribe>
        </div>

        <div id="check-config" className="space-y-4">
          <h2 className="font-medium">TCP Configuration</h2>
          <FormField className="flex-1">
            <form.Field name="tcpHostPort">
              {(field) => (
                <>
                  <Label htmlFor="tcpHostPort">Host:Port</Label>
                  <Input
                    id="tcpHostPort"
                    name="tcpHostPort"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="example.com:8080"
                    className={
                      field.state.meta.errors?.length
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {field.state.meta.errors?.length > 0 && (
                    <ErrorMessage errors={field.state.meta.errors[0]} />
                  )}
                  <p className="text-muted-foreground text-xs">
                    Enter the hostname and port to check (e.g.,
                    example.com:8080, database.local:5432)
                  </p>
                </>
              )}
            </form.Field>
          </FormField>
        </div>

        <div id="monitoring-regions" className="space-y-4">
          <form.Field name="regions">
            {(field) => (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">Monitoring Regions *</h2>
                    <span className="text-muted-foreground text-xs">
                      {field.state.value.length} region
                      {field.state.value.length !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    * Regions are a best effort and not a guarantee. Monitors
                    will not necessarily be instantiated in the hinted region,
                    but instead instantiated in a data center selected to
                    minimize latency.
                  </p>
                </div>

                <div className="p-2">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {[
                      "North America",
                      "South America",
                      "Europe",
                      "Africa",
                      "Middle East",
                      "Asia-Pacific",
                      "Oceania",
                    ].map((continent) => {
                      const regions = monitoringRegions.filter(
                        (r) => r.continent === continent
                      );
                      if (regions.length === 0) return null;

                      return (
                        <div key={continent} className="space-y-2">
                          <h3 className="text-sm font-medium">{continent}</h3>
                          <div className="grid gap-2">
                            {regions.map((region) => {
                              const isSelected = field.state.value.includes(
                                region.value
                              );
                              return (
                                <div
                                  key={region.value}
                                  className={cn(
                                    "dark:hover:bg-input/20 hover:bg-input/20 flex cursor-pointer items-center justify-between rounded-md border p-2 transition-colors",
                                    isSelected ? "border-primary" : ""
                                  )}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newRegions = isSelected
                                      ? field.state.value.filter(
                                          (r: string) => r !== region.value
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
                                            (r: string) => r !== region.value
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
                {field.state.meta.errors &&
                  field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
              </>
            )}
          </form.Field>
        </div>

        <div id="response-time-thresholds" className="space-y-4">
          <h2 className="font-medium">Response Time Thresholds</h2>
          <div className="flex flex-1 gap-4">
            <FormField>
              <form.Field name="degradedThresholdMs">
                {(field) => (
                  <>
                    <Label htmlFor="degradedThresholdMs">
                      Degraded Threshold (ms)
                    </Label>
                    <Input
                      id="degradedThresholdMs"
                      name="degradedThresholdMs"
                      type="number"
                      value={field.state.value ?? ""}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      onBlur={field.handleBlur}
                      placeholder="30000"
                      min="1000"
                      max="300000"
                      className={cn(
                        "flex-1",
                        field.state.meta.errors?.length && "border-destructive"
                      )}
                    />
                    {field.state.meta.errors?.length > 0 && (
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                    <p className="text-muted-foreground text-xs">
                      Time after which the endpoint is considered degraded.
                    </p>
                  </>
                )}
              </form.Field>
            </FormField>

            <FormField>
              <form.Field name="timeoutThresholdMs">
                {(field) => (
                  <>
                    <Label htmlFor="timeoutThresholdMs">
                      Timeout Threshold (ms)
                    </Label>
                    <Input
                      id="timeoutThresholdMs"
                      name="timeoutThresholdMs"
                      type="number"
                      value={field.state.value ?? ""}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      onBlur={field.handleBlur}
                      placeholder="45000"
                      min="1000"
                      max="600000"
                      className={cn(
                        "flex-1",
                        field.state.meta.errors?.length && "border-destructive"
                      )}
                    />
                    {field.state.meta.errors?.length > 0 && (
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                    <p className="text-muted-foreground text-xs">
                      Max. time allowed for request to complete.
                    </p>
                  </>
                )}
              </form.Field>
            </FormField>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, formIsSubmitting]) => (
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || formIsSubmitting || !canSubmit}
              >
                {isSubmitting || formIsSubmitting
                  ? "Submitting..."
                  : submitLabel}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
