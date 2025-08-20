import { Button } from "@/frontend/components/ui/button";
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
import { Textarea } from "@/frontend/components/ui/textarea";
import { monitoringRegions } from "@/frontend/lib/constants";
import { HttpMonitorSchema } from "@/frontend/lib/schemas";
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

export type HttpMonitorFormValues = z.infer<typeof HttpMonitorSchema>;

interface HttpMonitorFormProps {
  onSubmit: (values: {
    name: string;
    checkType: "http";
    url: string;
    method: "GET" | "POST" | "HEAD";
    interval: number;
    regions: string[];
    headers?: Record<string, string>;
    body?: Record<string, unknown> | string;
    slackWebhookUrl?: string;
    degradedThresholdMs?: number;
    timeoutThresholdMs?: number;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<{
    name: string;
    url: string;
    method: "GET" | "POST" | "HEAD";
    interval: number;
    regions: string[];
    headers: Record<string, string>;
    body: Record<string, unknown> | string;
    degradedThresholdMs?: number;
    timeoutThresholdMs?: number;
  }>;
}

const FormField = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("space-y-2", className)}>{children}</div>;

const ErrorMessage = ({ errors }: { errors?: string }) =>
  errors ? <p className="text-destructive text-sm">{errors}</p> : null;

export default function HttpMonitorForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Save",
  defaultValues,
}: HttpMonitorFormProps) {
  const defaultFormValues: HttpMonitorFormValues = {
    name: defaultValues?.name || "",
    url: defaultValues?.url || "",
    method: defaultValues?.method ?? "GET",
    interval: defaultValues?.interval ?? 300000,
    regions: defaultValues?.regions ?? [],
    headersString: defaultValues?.headers
      ? JSON.stringify(defaultValues.headers, null, 2)
      : "",
    bodyString: defaultValues?.body
      ? JSON.stringify(defaultValues.body, null, 2)
      : "",
    degradedThresholdMs: defaultValues?.degradedThresholdMs,
    timeoutThresholdMs: defaultValues?.timeoutThresholdMs,
  };

  const form = useForm({
    defaultValues: defaultFormValues,
    validators: {
      onChange: ({ value }) => {
        const result = HttpMonitorSchema.safeParse(value);
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
      let headers, body;
      try {
        headers = value.headersString
          ? JSON.parse(value.headersString)
          : undefined;
      } catch {
        // TODO: Set field error for invalid JSON
        return;
      }
      try {
        body = value.bodyString ? JSON.parse(value.bodyString) : undefined;
      } catch {
        // TODO: Set field error for invalid JSON
        return;
      }

      const payload = {
        name: value.name,
        checkType: "http" as const,
        url: value.url,
        method: value.method,
        interval: value.interval,
        regions: value.regions,
        headers,
        body,
        slackWebhookUrl: value.slackWebhookUrl,
        heartbeatId: value.enableHeartbeat ? value.heartbeatId : undefined,
        heartbeatTimeoutSeconds: value.enableHeartbeat
          ? value.heartbeatTimeoutSeconds
          : undefined,
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
                      placeholder="Example API"
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
        </div>

        <div id="check-config" className="space-y-4">
          <h2 className="font-medium">HTTP Configuration</h2>
          <div className="flex flex-1 gap-4">
            <FormField>
              <form.Field name="method">
                {(field) => (
                  <>
                    <Label htmlFor="method">Method</Label>
                    <Select
                      onValueChange={(value) =>
                        field.handleChange(value as "GET" | "POST" | "HEAD")
                      }
                      value={field.state.value}
                    >
                      <SelectTrigger
                        id="method"
                        className={
                          field.state.meta.errors?.length
                            ? "border-destructive"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Select method" />
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
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                  </>
                )}
              </form.Field>
            </FormField>

            <FormField className="w-full flex-1">
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
                      className={cn(
                        "flex-1",
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
          </div>
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
                      value={field.state.value || ""}
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
                      value={field.state.value || ""}
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

        <div id="advanced-options" className="space-y-4">
          <h2 className="font-medium">Advanced Options</h2>
          <div className="space-y-4">
            <FormField>
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
                        field.state.meta.errors?.length && "border-destructive"
                      )}
                    />
                    {field.state.meta.errors?.length > 0 && (
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                    <p className="text-muted-foreground text-xs">
                      Enter headers as a valid JSON object
                    </p>
                  </>
                )}
              </form.Field>
            </FormField>

            <form.Field name="method">
              {(methodField) =>
                methodField.state.value === "POST" && (
                  <FormField>
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
                              field.state.meta.errors?.length &&
                                "border-destructive"
                            )}
                          />
                          {field.state.meta.errors?.length > 0 && (
                            <ErrorMessage errors={field.state.meta.errors[0]} />
                          )}
                          <p className="text-muted-foreground text-xs">
                            Only applicable for POST requests
                          </p>
                        </>
                      )}
                    </form.Field>
                  </FormField>
                )
              }
            </form.Field>
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
