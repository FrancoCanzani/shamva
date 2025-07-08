import { HttpMonitorSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { MonitorFormNotificationsSection } from "./monitor-form-notifications-section";
import { MonitorFormRegionsSection } from "./monitor-form-regions-section";

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
    slack_webhook_url: string;
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
  const methods = useForm<HttpMonitorFormValues>({
    resolver: zodResolver(HttpMonitorSchema),
    defaultValues: {
      name: defaultValues?.name,
      url: defaultValues?.url,
      method: defaultValues?.method ?? "GET",
      interval: defaultValues?.interval ?? 300000,
      regions: defaultValues?.regions ?? [],
      headersString: defaultValues?.headers
        ? JSON.stringify(defaultValues.headers, null, 2)
        : "",
      bodyString: defaultValues?.body
        ? JSON.stringify(defaultValues.body, null, 2)
        : "",
      slackWebhookUrl: defaultValues?.slack_webhook_url,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = methods;

  const method = watch("method");

  // On submit, parse JSON fields
  const onFormSubmit = async (data: HttpMonitorFormValues) => {
    let headers, body;
    try {
      headers = data.headersString ? JSON.parse(data.headersString) : undefined;
    } catch {
      // set error here
      return;
    }
    try {
      body = data.bodyString ? JSON.parse(data.bodyString) : undefined;
    } catch {
      // set error here
      return;
    }

    const payload = {
      name: data.name,
      checkType: "http" as const,
      url: data.url,
      method: data.method,
      interval: data.interval,
      regions: data.regions,
      headers,
      body,
      slackWebhookUrl: data.slackWebhookUrl,
      heartbeatId: data.enableHeartbeat ? data.heartbeatId : undefined,
      heartbeatTimeoutSeconds: data.enableHeartbeat
        ? data.heartbeatTimeoutSeconds
        : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <FormProvider {...methods}>
      <div className="flex gap-8">
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex-1 space-y-8"
        >
          <div id="basic-config" className="space-y-4">
            <h2 className="font-medium">Basic Configuration</h2>
            <div className="flex w-full gap-4">
              <FormField className="w-full flex-1">
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
                      onValueChange={(value) =>
                        field.onChange(Number.parseInt(value, 10))
                      }
                      value={field.value.toString()}
                    >
                      <SelectTrigger
                        id="interval"
                        className={errors.interval ? "border-destructive" : ""}
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
                  )}
                />
                <ErrorMessage errors={errors.interval?.message} />
              </FormField>
            </div>
          </div>

          <div id="check-config" className="space-y-4">
            <h2 className="font-medium">HTTP Configuration</h2>
            <div className="flex flex-1 gap-4">
              <FormField>
                <Label htmlFor="method">Method</Label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value as "GET" | "POST" | "HEAD")
                      }
                      value={field.value}
                    >
                      <SelectTrigger
                        id="method"
                        className={errors.method ? "border-destructive" : ""}
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
                  )}
                />
                <ErrorMessage errors={errors.method?.message} />
              </FormField>

              <FormField className="w-full flex-1">
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
          </div>

          <MonitorFormRegionsSection />

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
                <p className="text-muted-foreground text-xs">
                  Enter headers as a valid JSON object
                </p>
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
                  <p className="text-muted-foreground text-xs">
                    Only applicable for POST requests
                  </p>
                </FormField>
              )}
            </div>
          </div>

          <MonitorFormNotificationsSection />

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
    </FormProvider>
  );
}
