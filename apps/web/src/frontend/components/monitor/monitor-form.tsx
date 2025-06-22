import { monitoringRegions } from "@/frontend/lib/constants";
import { MonitorFormSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Check } from "lucide-react";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import MonitorFormSectionSelector from "./monitor-form-section-selector";
import { Link } from "@tanstack/react-router";

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
    if (!acc[region.continent]) acc[region.continent] = [];
    acc[region.continent].push(region);
    return acc;
  },
  {} as Record<string, typeof monitoringRegions>
);

const continentOrder = ["North America", "South America", "Europe", "Africa", "Middle East", "Asia-Pacific", "Oceania"];

export type MonitorFormValues = z.infer<typeof MonitorFormSchema>;

interface MonitorFormProps {
  onSubmit: (values: {
    name: string;
    checkType: "http" | "tcp";
    url: string;
    tcpHostPort: string;
    method?: "GET" | "POST" | "HEAD";
    interval: number;
    regions: string[];
    headers?: Record<string, string>;
    body?: Record<string, unknown> | string;
    slackWebhookUrl?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<{
    name: string;
    checkType: "http" | "tcp";
    url: string;
    tcpHostPort: string;
    method: "GET" | "POST" | "HEAD";
    interval: number;
    regions: string[];
    headers: Record<string, string>;
    body: Record<string, unknown> | string;
    slack_webhook_url: string;
  }>;
}

const FormField = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-2", className)}>{children}</div>
);

const ErrorMessage = ({ errors }: { errors?: (string | undefined)[] }) => 
  errors?.[0] ? <p className="text-sm text-destructive">{errors[0]}</p> : null;

export default function MonitorForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Save",
  defaultValues,
}: MonitorFormProps) {
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? "",
      checkType: defaultValues?.checkType ?? "http",
      url: defaultValues?.url ?? "",
      tcpHostPort: defaultValues?.tcpHostPort ?? "",
      method: defaultValues?.method ?? "GET",
      interval: defaultValues?.interval ?? 300000,
      regions: defaultValues?.regions ?? [],
      headersString: defaultValues?.headers ? JSON.stringify(defaultValues.headers, null, 2) : "",
      bodyString: defaultValues?.body ? JSON.stringify(defaultValues.body, null, 2) : "",
      slackWebhookUrl: defaultValues?.slack_webhook_url || undefined,
    },
    onSubmit: async ({ value }) => {
      const headers = value.headersString ? JSON.parse(value.headersString) : undefined;
      const body = value.bodyString ? JSON.parse(value.bodyString) : undefined;

      await onSubmit({
        name: value.name,
        checkType: value.checkType,
        url: value.url,
        tcpHostPort: value.tcpHostPort,
        method: value.checkType === "http" ? value.method : undefined,
        interval: value.interval,
        regions: value.regions,
        headers,
        body,
        slackWebhookUrl: value.slackWebhookUrl,
      });
    },
    validators: {
      onBlur: ({ value }) => {
        try {
          MonitorFormSchema.parse(value);
          return undefined;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string> = {};
            error.errors.forEach((err) => {
              fieldErrors[err.path.join(".")] = err.message;
            });
            return { fields: fieldErrors };
          }
          return { form: "Invalid form data" };
        }
      },
    },
  });

  return (
    <div className="flex gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex-1 space-y-8"
      >
        <div id="basic-config" className="space-y-4">
          <h2 className="font-medium">Basic Configuration</h2>
          <div className="flex gap-4 w-full">
            <form.Field name="name">
              {(field) => (
                <FormField className="flex-1 w-full">
                  <Label htmlFor="name">Monitor name</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Example API"
                    className={cn("w-full", field.state.meta.errors?.length && "border-destructive")}
                  />
                  <ErrorMessage errors={field.state.meta.errors} />
                </FormField>
              )}
            </form.Field>

            <form.Field name="interval">
              {(field) => (
                <FormField>
                  <Label htmlFor="interval">Check interval</Label>
                  <Select
                    onValueChange={(value) => field.handleChange(Number.parseInt(value, 10))}
                    value={field.state.value.toString()}
                    onOpenChange={() => !field.state.meta.isTouched && field.handleBlur()}
                  >
                    <SelectTrigger
                      id="interval"
                      className={field.state.meta.errors?.length ? "border-destructive" : ""}
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
                  <ErrorMessage errors={field.state.meta.errors} />
                </FormField>
              )}
            </form.Field>
          </div>
        </div>

        <div id="check-config" className="space-y-4">
          <h2 className="font-medium">Check Configuration</h2>
          
          <form.Field name="checkType">
            {(checkTypeField) => (
              <div className="space-y-4 w-full">
                <div className="flex flex-col w-full sm:flex-row gap-4">
                  <FormField>
                    <Label htmlFor="checkType">Check Type</Label>
                    <Select
                      onValueChange={(value) => checkTypeField.handleChange(value as "http" | "tcp")}
                      value={checkTypeField.state.value}
                      onOpenChange={() => !checkTypeField.state.meta.isTouched && checkTypeField.handleBlur()}
                    >
                      <SelectTrigger
                        id="checkType"
                        className={cn("w-full sm:w-fit", checkTypeField.state.meta.errors?.length && "border-destructive")}
                      >
                        <SelectValue placeholder="Select check type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="http">HTTP/HTTPS</SelectItem>
                          <SelectItem value="tcp">TCP</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <ErrorMessage errors={checkTypeField.state.meta.errors} />
                  </FormField>

                  {checkTypeField.state.value === "http" && (
                    <div className="flex gap-4 flex-1">
                      <form.Field name="method">
                        {(field) => (
                          <FormField>
                            <Label htmlFor="method">Method</Label>
                            <Select
                              onValueChange={(value) => field.handleChange(value as "GET" | "POST" | "HEAD")}
                              value={field.state.value}
                              onOpenChange={() => !field.state.meta.isTouched && field.handleBlur()}
                            >
                              <SelectTrigger
                                id="method"
                                className={field.state.meta.errors?.length ? "border-destructive" : ""}
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
                            <ErrorMessage errors={field.state.meta.errors} />
                          </FormField>
                        )}
                      </form.Field>

                      <form.Field name="url">
                        {(field) => (
                          <FormField className="flex-1 w-full">
                            <Label htmlFor="url">URL to Monitor</Label>
                            <Input
                              id="url"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              placeholder="https://example.com/api"
                              className={cn("flex-1", field.state.meta.errors?.length && "border-destructive")}
                            />
                            <ErrorMessage errors={field.state.meta.errors} />
                          </FormField>
                        )}
                      </form.Field>
                    </div>
                  )}

                  {checkTypeField.state.value === "tcp" && (
                    <form.Field name="tcpHostPort">
                      {(field) => (
                        <FormField className="flex-1">
                          <Label htmlFor="tcpHostPort">Host:Port</Label>
                          <Input
                            id="tcpHostPort"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="example.com:8080"
                            className={field.state.meta.errors?.length ? "border-destructive" : ""}
                          />
                          <ErrorMessage errors={field.state.meta.errors} />
                          <p className="text-xs text-muted-foreground">
                            Enter the hostname and port to check (e.g., example.com:8080)
                          </p>
                        </FormField>
                      )}
                    </form.Field>
                  )}
                </div>
              </div>
            )}
          </form.Field>
        </div>

        <div id="monitoring-regions" className="space-y-4">
          <form.Field name="regions">
            {(field) => (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">Monitoring Regions *</h2>
                    <span className="text-xs text-muted-foreground">
                      {field.state.value.length} region{field.state.value.length !== 1 ? "s" : ""} selected
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
                              const isSelected = field.state.value.includes(region.value);
                              return (
                                <div
                                  key={region.value}
                                  className={cn(
                                    "flex items-center justify-between p-2 border cursor-pointer hover:bg-slate-50 transition-colors",
                                    isSelected ? "border-primary bg-slate-50" : ""
                                  )}
                                  onClick={() => {
                                    const newRegions = isSelected
                                      ? field.state.value.filter((r) => r !== region.value)
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
                                        ? field.state.value.filter((r) => r !== region.value)
                                        : [...field.state.value, region.value];
                                      field.handleChange(newRegions);
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
                <ErrorMessage errors={field.state.meta.errors} />
              </>
            )}
          </form.Field>
        </div>

        <form.Field name="checkType">
          {(checkTypeField) =>
            checkTypeField.state.value === "http" && (
              <div id="advanced-options" className="space-y-4">
                <h2 className="font-medium">Advanced Options</h2>
                <div className="space-y-4 border border-dashed p-4">
                  <form.Field name="headersString">
                    {(field) => (
                      <FormField>
                        <Label htmlFor="headersString">Headers (JSON String)</Label>
                        <Textarea
                          id="headersString"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                          rows={8}
                          className={cn(
                            "text-sm",
                            field.state.meta.errors?.length ? "border-destructive" : ""
                          )}
                        />
                        <ErrorMessage errors={field.state.meta.errors} />
                        <p className="text-xs text-muted-foreground">Enter headers as a valid JSON object</p>
                      </FormField>
                    )}
                  </form.Field>

                  <form.Field name="method">
                    {(methodField) =>
                      methodField.state.value === "POST" && (
                        <form.Field name="bodyString">
                          {(field) => (
                            <FormField>
                              <Label htmlFor="bodyString">Request Body (JSON String)</Label>
                              <Textarea
                                id="bodyString"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                placeholder='{"key": "value"}'
                                rows={8}
                                className={cn(
                                  "text-sm",
                                  field.state.meta.errors?.length ? "border-destructive" : ""
                                )}
                              />
                              <ErrorMessage errors={field.state.meta.errors} />
                              <p className="text-xs text-muted-foreground">Only applicable for POST requests</p>
                            </FormField>
                          )}
                        </form.Field>
                      )
                    }
                  </form.Field>
                </div>
              </div>
            )
          }
        </form.Field>

        <div id="notifications" className="space-y-4">
          <h3 className="text-sm font-medium">Notifications</h3>
          <p className="text-xs text-muted-foreground">
            * Every accepted user in your workspace will receive email notifications. 
            Additionally, you can configure Slack notifications.
          </p>
          <form.Field name="slackWebhookUrl">
            {(field) => (
              <FormField>
                <Label htmlFor={field.name}>Slack Webhook URL</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
                <ErrorMessage errors={field.state.meta.errors} />
                <p className="text-xs text-muted-foreground">
                  Optional. Add a{" "}
                  <Link
                    className="underline font-medium text-primary"
                    to="/dashboard/$workspaceName/monitors"
                    params={{ workspaceName: "workspaceName" }}
                  >
                    Slack webhook URL
                  </Link>{" "}
                  to receive notifications in your Slack channel.
                </p>
              </FormField>
            )}
          </form.Field>
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

      <MonitorFormSectionSelector />
    </div>
  );
}