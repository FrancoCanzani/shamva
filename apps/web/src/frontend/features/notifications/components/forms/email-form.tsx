import { Button } from "@/frontend/components/ui/button";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Notifications } from "../../types";

interface EmailFormProps {
  config: Notifications;
  onSave: (updates: Partial<Notifications>) => Promise<void>;
  isLoading: boolean;
}

const emailFormSchema = z.object({
  enabled: z.boolean(),
});

export function EmailForm({ config, onSave, isLoading }: EmailFormProps) {
  const form = useForm({
    defaultValues: {
      enabled: config.email_enabled,
    },
    validators: {
      onChange: emailFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        email_enabled: value.enabled,
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
                <Label htmlFor="email-enabled" className="font-medium">
                  Enable Email Notifications
                </Label>
                <p className="text-muted-foreground text-sm">
                  Send monitor alerts via email to workspace members.
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={field.state.value}
                onCheckedChange={field.handleChange}
              />
            </div>
          )}
        </form.Field>

        <div className="bg-muted/50 rounded-md p-4">
          <p className="text-muted-foreground text-sm">
            Email notifications will be sent to all workspace members
            automatically. No additional configuration is required.
          </p>
        </div>
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
