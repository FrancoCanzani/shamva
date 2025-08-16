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
import { TcpMonitorSchema } from "@/frontend/lib/schemas";
import { cn } from "@/frontend/lib/utils";
import { monitoringRegions } from "@/frontend/utils/constants";
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
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<{
    name: string;
    tcpHostPort: string;
    interval: number;
    regions: string[];
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

                <div className="border border-dashed p-2">
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
                                    "flex cursor-pointer items-center justify-between border p-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800",
                                    isSelected
                                      ? "border-primary bg-stone-50 dark:bg-stone-800"
                                      : ""
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
