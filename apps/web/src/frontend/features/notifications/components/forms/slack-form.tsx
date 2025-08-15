import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Notifications } from "../../types";

interface SlackFormProps {
  config: Notifications;
  onSave: (updates: Partial<Notifications>) => Promise<void>;
  isLoading: boolean;
}

const slackFormSchema = z
  .object({
    enabled: z.boolean(),
    webhookUrl: z.string(),
    channel: z.string(),
  })
  .refine(
    (data) => {
      if (data.enabled && (!data.webhookUrl || data.webhookUrl.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Webhook URL is required when Slack notifications are enabled",
      path: ["webhookUrl"],
    }
  )
  .refine(
    (data) => {
      if (data.enabled && data.webhookUrl) {
        try {
          new URL(data.webhookUrl);
          return data.webhookUrl.includes("hooks.slack.com");
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: "Please enter a valid Slack webhook URL",
      path: ["webhookUrl"],
    }
  );

export function SlackForm({ config, onSave, isLoading }: SlackFormProps) {
  const form = useForm({
    defaultValues: {
      enabled: config.slack_enabled,
      webhookUrl: config.slack_webhook_url || "",
      channel: config.slack_channel || "",
    },
    validators: {
      onChange: slackFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        slack_enabled: value.enabled,
        slack_webhook_url: value.enabled ? value.webhookUrl || null : null,
        slack_channel: value.enabled ? value.channel || null : null,
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
                <Label htmlFor="slack-enabled" className="font-medium">
                  Enable Slack Notifications
                </Label>
                <p className="text-muted-foreground text-sm">
                  Send monitor alerts to your Slack channel.
                </p>
              </div>
              <Switch
                id="slack-enabled"
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
                <form.Field name="webhookUrl">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL *</Label>
                      <Input
                        id="webhook-url"
                        type="url"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-500">
                            {String(field.state.meta.errors[0])}
                          </p>
                        )}
                      <p className="text-muted-foreground text-xs">
                        Create a webhook in your Slack workspace settings
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="channel">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="channel">Channel (optional)</Label>
                      <Input
                        id="channel"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="#alerts"
                      />
                      <p className="text-muted-foreground text-xs">
                        Display name for the channel (doesn't affect
                        functionality)
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
