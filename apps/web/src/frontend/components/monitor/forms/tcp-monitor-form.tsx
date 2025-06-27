import { TcpMonitorSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { MonitorFormRegionsSection } from "./monitor-form-regions-section";
import { MonitorFormNotificationsSection } from "./monitor-form-notifications-section";

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
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<{
    name: string;
    tcpHostPort: string;
    interval: number;
    regions: string[];
    slack_webhook_url: string;
  }>;
}

const FormField = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-2", className)}>{children}</div>
);

const ErrorMessage = ({ errors }: { errors?: string }) => 
  errors ? <p className="text-sm text-destructive">{errors}</p> : null;

export default function TcpMonitorForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Save",
  defaultValues,
}: TcpMonitorFormProps) {
  const methods = useForm<TcpMonitorFormValues>({
    resolver: zodResolver(TcpMonitorSchema),
    defaultValues: {
      name: defaultValues?.name,
      tcpHostPort: defaultValues?.tcpHostPort,
      interval: defaultValues?.interval ?? 300000,
      regions: defaultValues?.regions ?? [],
      slackWebhookUrl: defaultValues?.slack_webhook_url,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  const onFormSubmit = async (data: TcpMonitorFormValues) => {
    const payload = {
      name: data.name,
      checkType: "tcp" as const,
      tcpHostPort: data.tcpHostPort,
      interval: data.interval,
      regions: data.regions,
      slackWebhookUrl: data.slackWebhookUrl,
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
            <div className="flex gap-4 w-full">
              <FormField className="flex-1 w-full">
                <Label htmlFor="name">Monitor name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Database Connection"
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
            <h2 className="font-medium">TCP Configuration</h2>
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
                Enter the hostname and port to check (e.g., example.com:8080, database.local:5432)
              </p>
            </FormField>
          </div>

          <MonitorFormRegionsSection />

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