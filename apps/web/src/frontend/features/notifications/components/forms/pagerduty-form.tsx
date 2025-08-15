import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Notifications } from "../../types";

interface PagerDutyFormProps {
  config: Notifications;
  onSave: (updates: Partial<Notifications>) => Promise<void>;
  isLoading: boolean;
}

const pagerDutyFormSchema = z
  .object({
    enabled: z.boolean(),
    serviceId: z.string(),
    apiKey: z.string(),
    fromEmail: z.string(),
  })
  .refine(
    (data) => {
      if (data.enabled) {
        return (
          data.serviceId &&
          data.serviceId.trim() !== "" &&
          data.apiKey &&
          data.apiKey.trim() !== "" &&
          data.fromEmail &&
          data.fromEmail.trim() !== ""
        );
      }
      return true;
    },
    {
      message:
        "All fields are required when PagerDuty notifications are enabled",
    }
  )
  .refine(
    (data) => {
      if (data.enabled && data.fromEmail) {
        return z.string().email().safeParse(data.fromEmail).success;
      }
      return true;
    },
    {
      message: "Please enter a valid email address",
      path: ["fromEmail"],
    }
  );

export function PagerDutyForm({
  config,
  onSave,
  isLoading,
}: PagerDutyFormProps) {
  const form = useForm({
    defaultValues: {
      enabled: config.pagerduty_enabled,
      serviceId: config.pagerduty_service_id || "",
      apiKey: config.pagerduty_api_key || "",
      fromEmail: config.pagerduty_from_email || "",
    },
    validators: {
      onChange: pagerDutyFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        pagerduty_enabled: value.enabled,
        pagerduty_service_id: value.enabled ? value.serviceId || null : null,
        pagerduty_api_key: value.enabled ? value.apiKey || null : null,
        pagerduty_from_email: value.enabled ? value.fromEmail || null : null,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex h-full flex-col justify-between space-y-8"
    >
      <div className="space-y-8">
        <form.Field name="enabled">
          {(field) => (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pagerduty-enabled" className="font-medium">
                  Enable PagerDuty Notifications
                </Label>
                <p className="text-muted-foreground text-sm">
                  Create and manage incidents in PagerDuty.
                </p>
              </div>
              <Switch
                id="pagerduty-enabled"
                checked={field.state.value}
                onCheckedChange={field.handleChange}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="enabled">
          {(enabledField) =>
            enabledField.state.value && (
              <div className="space-y-4">
                <form.Field name="serviceId">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="service-id">Service ID *</Label>
                      <Input
                        id="service-id"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="P1234567"
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {String(field.state.meta.errors[0])}
                          </p>
                        )}
                      <p className="text-muted-foreground text-xs">
                        Find this in your PagerDuty service configuration
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="apiKey">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key *</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Enter your PagerDuty API key"
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {String(field.state.meta.errors[0])}
                          </p>
                        )}
                      <p className="text-muted-foreground text-xs">
                        Create an API key in PagerDuty with incidents:write
                        permission
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="fromEmail">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="from-email">From Email *</Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="shamva-monitoring@yourdomain.com"
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {String(field.state.meta.errors[0])}
                          </p>
                        )}
                      <p className="text-muted-foreground text-xs">
                        Email address to use when creating incidents
                      </p>
                    </div>
                  )}
                </form.Field>
              </div>
            )
          }
        </form.Field>
      </div>

      <div className="flex justify-end">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size={"sm"}
              disabled={!canSubmit || isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? "Saving..." : "Save Configuration"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
