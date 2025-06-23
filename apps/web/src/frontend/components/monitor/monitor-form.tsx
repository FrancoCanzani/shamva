import { monitoringRegions } from "@/frontend/lib/constants";
import { MonitorFormSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Check } from "lucide-react";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

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

const ErrorMessage = ({ errors }: { errors?: string }) => 
  errors ? <p className="text-sm text-destructive">{errors}</p> : null;

const checkTypeTabs = [
  {
    value: "http",
    label: "HTTP/HTTPS",
    description: "Use this for monitoring web endpoints (APIs, websites, etc). Checks support GET, POST, and HEAD methods, and can include headers and a request body.",
  },
  {
    value: "tcp",
    label: "TCP",
    description: "Use this for monitoring raw TCP endpoints (custom services, databases, etc). Checks only if a TCP connection can be established to the host:port.",
  },
];

export default function MonitorForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Save",
  defaultValues,
}: MonitorFormProps) {
  const [checkType, setCheckType] = useState<"http" | "tcp">(defaultValues?.checkType ?? "http");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MonitorFormValues>({
    resolver: zodResolver(MonitorFormSchema),
    defaultValues: {
      name: defaultValues?.name,
      checkType: defaultValues?.checkType ?? "http",
      url: defaultValues?.url,
      tcpHostPort: defaultValues?.tcpHostPort,
      method: defaultValues?.method ?? "GET",
      interval: defaultValues?.interval ?? 300000,
      regions: defaultValues?.regions ?? [],
      headersString: defaultValues?.headers ? JSON.stringify(defaultValues.headers, null, 2) : "",
      bodyString: defaultValues?.body ? JSON.stringify(defaultValues.body, null, 2) : "",
      slackWebhookUrl: defaultValues?.slack_webhook_url,
    },
  });

  // Keep checkType in sync with tab
  const handleTabChange = (type: "http" | "tcp") => {
    setCheckType(type);
    setValue("checkType", type);
  };

  // Watch for method to show/hide body
  const method = watch("method");

  // Watch for regions
  const selectedRegions = watch("regions");

  // On submit, parse JSON fields
  const onFormSubmit = async (data: MonitorFormValues) => {
    let headers, body;
    try {
      headers = data.headersString ? JSON.parse(data.headersString) : undefined;
    } catch (e) {
      // Optionally set error here
      return;
    }
    try {
      body = data.bodyString ? JSON.parse(data.bodyString) : undefined;
    } catch (e) {
      // Optionally set error here
      return;
    }
    const payload: any = {
      name: data.name,
      checkType: data.checkType,
      interval: data.interval,
      regions: data.regions,
      headers,
      body,
      slackWebhookUrl: data.slackWebhookUrl,
    };
    if (data.checkType === "http") {
      payload.method = data.method;
      payload.url = data.url
    }
    if (data.checkType === "tcp") {
      payload.method = undefined;
      payload.tcpHostPort = data.tcpHostPort
    }
    await onSubmit(payload);
  };

  return (
    <div className="flex gap-8">
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex-1 space-y-8"
      >
        <div className="mb-6">
          <div className="flex gap-2 border-b mb-2">
            {checkTypeTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  checkType === tab.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
                )}
                onClick={() => handleTabChange(tab.value as "http" | "tcp")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            {checkTypeTabs.find((tab) => tab.value === checkType)?.description}
          </div>
        </div>

        <div id="basic-config" className="space-y-4">
          <h2 className="font-medium">Basic Configuration</h2>
          <div className="flex gap-4 w-full">
            <FormField className="flex-1 w-full">
              <Label htmlFor="name">Monitor name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Example API"
                className={cn("w-full", errors.name && "border-destructive")}
              />
              <ErrorMessage errors={errors.name?.message} />
            </FormField>

            <FormField>
              <Label htmlFor="interval">Check interval</Label>
              <Controller
                control={control}
                name="interval"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(Number.parseInt(value, 10))}
                    value={field.value.toString()}
                  >
                    <SelectTrigger id="interval" className={errors.interval ? "border-destructive" : ""}>
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
                )}
              />
              <ErrorMessage errors={errors.interval?.message} />
            </FormField>
          </div>
        </div>

        <div id="check-config" className="space-y-4">
          <h2 className="font-medium">Check Configuration</h2>
          {checkType === "http" && (
            <div className="flex gap-4 flex-1">
              <FormField>
                <Label htmlFor="method">Method</Label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(value as "GET" | "POST" | "HEAD")}
                      value={field.value}
                    >
                      <SelectTrigger id="method" className={errors.method ? "border-destructive" : ""}>
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
                  )}
                />
                <ErrorMessage errors={errors.method?.message} />
              </FormField>

              <FormField className="flex-1 w-full">
                <Label htmlFor="url">URL to Monitor</Label>
                <Input
                  id="url"
                  {...register("url")}
                  placeholder="https://example.com/api"
                  className={cn("flex-1", errors.url && "border-destructive")}
                />
                <ErrorMessage errors={errors.url?.message} />
              </FormField>
            </div>
          )}
          {checkType === "tcp" && (
            <FormField className="flex-1">
              <Label htmlFor="tcpHostPort">Host:Port</Label>
              <Input
                id="tcpHostPort"
                {...register("tcpHostPort")}
                placeholder="example.com:8080"
                className={errors.tcpHostPort ? "border-destructive" : ""}
              />
              <ErrorMessage errors={errors.tcpHostPort?.message} />
              <p className="text-xs text-muted-foreground">
                Enter the hostname and port to check (e.g., example.com:8080)
              </p>
            </FormField>
          )}
        </div>

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
                                    "flex items-center justify-between p-2 border cursor-pointer hover:bg-slate-50 dark:hover:bg-carbon-800 transition-colors",
                                    isSelected ? "border-primary bg-slate-50 dark:bg-carbon-800" : ""
                                  )}
                                  onClick={() => {
                                    const newRegions = isSelected
                                      ? field.value.filter((r) => r !== region.value)
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
                                        ? field.value.filter((r) => r !== region.value)
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
                <ErrorMessage errors={errors.regions?.message} />
              </>
            )}
          />
        </div>

        {checkType === "http" && (
          <div id="advanced-options" className="space-y-4">
            <h2 className="font-medium">Advanced Options</h2>
            <div className="space-y-4 border border-dashed p-4">
              <FormField>
                <Label htmlFor="headersString">Headers (JSON String)</Label>
                <Textarea
                  id="headersString"
                  {...register("headersString")}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  rows={8}
                  className={cn(
                    "text-sm",
                    errors.headersString && "border-destructive"
                  )}
                />
                <ErrorMessage errors={errors.headersString?.message} />
                <p className="text-xs text-muted-foreground">Enter headers as a valid JSON object</p>
              </FormField>

              {method === "POST" && (
                <FormField>
                  <Label htmlFor="bodyString">Request Body (JSON String)</Label>
                  <Textarea
                    id="bodyString"
                    {...register("bodyString")}
                    placeholder='{"key": "value"}'
                    rows={8}
                    className={cn(
                      "text-sm",
                      errors.bodyString && "border-destructive"
                    )}
                  />
                  <ErrorMessage errors={errors.bodyString?.message} />
                  <p className="text-xs text-muted-foreground">Only applicable for POST requests</p>
                </FormField>
              )}
            </div>
          </div>
        )}

        <div id="notifications" className="space-y-4">
          <h3 className="text-sm font-medium">Notifications</h3>
          <p className="text-xs text-muted-foreground">
            * Every accepted user in your workspace will receive email notifications. 
            Additionally, you can configure Slack notifications.
          </p>
          <FormField>
            <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
            <Input
              id="slackWebhookUrl"
              {...register("slackWebhookUrl")}
              placeholder="https://hooks.slack.com/services/..."
            />
            <ErrorMessage errors={errors.slackWebhookUrl?.message} />
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
    </div>
  );
}