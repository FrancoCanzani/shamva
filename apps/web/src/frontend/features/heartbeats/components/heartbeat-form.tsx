import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { HeartbeatSchema } from "@/frontend/lib/schemas";
import { Heartbeat } from "@/frontend/types/types";
import { cn } from "@/frontend/utils/utils";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

interface HeartbeatFormProps {
  workspaceId: string;
  heartbeat?: Heartbeat;
  pingId?: string;
  onSubmit: (data: z.infer<typeof HeartbeatSchema>) => Promise<void>;
  onCancel: () => void;
}

const timeUnits = [
  { value: 1000, label: "seconds" },
  { value: 60000, label: "minutes" },
  { value: 3600000, label: "hours" },
  { value: 86400000, label: "days" },
];

const FormField = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("space-y-2", className)}>{children}</div>;

const ErrorMessage = ({ errors }: { errors?: string }) =>
  errors ? <p className="text-destructive text-sm">{errors}</p> : null;

export default function HeartbeatForm({
  workspaceId,
  heartbeat,
  pingId,
  onSubmit,
  onCancel,
}: HeartbeatFormProps) {
  const getTimeValueAndUnit = (ms: number) => {
    for (let i = timeUnits.length - 1; i >= 0; i--) {
      const unit = timeUnits[i];
      if (ms % unit.value === 0) {
        return { value: ms / unit.value, unit: unit.value };
      }
    }
    return { value: ms / 1000, unit: 1000 };
  };

  type HeartbeatFormValues = z.infer<typeof HeartbeatSchema>;

  const defaultValues: HeartbeatFormValues = {
    name: heartbeat?.name || "",
    expectedLapseMs: heartbeat?.expected_lapse_ms || 60000,
    gracePeriodMs: heartbeat?.grace_period_ms || 10000,
    workspaceId: workspaceId,
    pingId: heartbeat?.ping_id || pingId || "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onChange: ({ value }) => {
        const result = HeartbeatSchema.safeParse(value);
        if (result.success) return undefined;
        
        const fieldErrors: Record<string, string> = {};
        
        for (const issue of result.error.issues) {
          const path = issue.path.join('.');
          if (path && !fieldErrors[path]) {
            fieldErrors[path] = issue.message;
          }
        }
        return { fields: fieldErrors };
      },
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <form.Field name="pingId">
        {(field) => <input type="hidden" value={field.state.value} />}
      </form.Field>

      <FormField>
        <form.Field name="name">
          {(field) => (
            <>
              <Label htmlFor="name">Heartbeat name *</Label>
              <Input
                id="name"
                name="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Daily database backup"
                className={cn(
                  "w-full",
                  field.state.meta.errors?.length && "border-destructive"
                )}
              />
              <p className="text-muted-foreground text-sm">
                A descriptive name for your heartbeat monitor
              </p>
              {field.state.meta.errors?.length > 0 && (
                <ErrorMessage errors={field.state.meta.errors[0]} />
              )}
            </>
          )}
        </form.Field>
      </FormField>

      <div className="flex w-full flex-col items-start gap-6 md:flex-row">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Timing Configuration</h3>
          <p className="text-muted-foreground text-sm text-balance">
            Configure the expected interval between pings and the grace period
            for late pings before an alert is triggered.
          </p>
        </div>

        <div className="w-full space-y-4 rounded border p-4 shadow-xs">
          <div className="space-y-4">
            <FormField className="space-y-2">
              <form.Field name="expectedLapseMs">
                {(field) => (
                  <>
                    <Label className="text-sm">Expected heartbeat interval</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm whitespace-nowrap">Every</span>
                      <Input
                        type="number"
                        value={getTimeValueAndUnit(field.state.value).value}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          const unit = getTimeValueAndUnit(field.state.value).unit;
                          const ms = value * unit;
                          field.handleChange(ms);
                        }}
                        min="1"
                        className="w-24"
                      />
                      <Select
                        value={getTimeValueAndUnit(field.state.value).unit.toString()}
                        onValueChange={(value) => {
                          const unit = Number(value);
                          const currentValue = getTimeValueAndUnit(field.state.value).value;
                          const ms = currentValue * unit;
                          field.handleChange(ms);
                        }}
                      >
                        <SelectTrigger className="w-32 capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeUnits.map((unit) => (
                            <SelectItem
                              key={unit.value}
                              value={unit.value.toString()}
                              className="capitalize"
                            >
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {field.state.meta.errors?.length > 0 && (
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                  </>
                )}
              </form.Field>
            </FormField>

            <FormField className="space-y-2">
              <form.Field name="gracePeriodMs">
                {(field) => (
                  <>
                    <Label className="text-sm">Grace period</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm whitespace-nowrap">Allow</span>
                      <Input
                        type="number"
                        value={getTimeValueAndUnit(field.state.value).value}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          const unit = getTimeValueAndUnit(field.state.value).unit;
                          const ms = value * unit;
                          field.handleChange(ms);
                        }}
                        min="1"
                        className="w-24"
                      />
                      <Select
                        value={getTimeValueAndUnit(field.state.value).unit.toString()}
                        onValueChange={(value) => {
                          const unit = Number(value);
                          const currentValue = getTimeValueAndUnit(field.state.value).value;
                          const ms = currentValue * unit;
                          field.handleChange(ms);
                        }}
                      >
                        <SelectTrigger className="w-32 capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeUnits.map((unit) => (
                            <SelectItem
                              key={unit.value}
                              value={unit.value.toString()}
                              className="capitalize"
                            >
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm whitespace-nowrap">delay</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Additional time allowed before triggering an alert
                    </p>
                    {field.state.meta.errors?.length > 0 && (
                      <ErrorMessage errors={field.state.meta.errors[0]} />
                    )}
                  </>
                )}
              </form.Field>
            </FormField>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, formIsSubmitting]) => (
            <Button
              type="submit"
              size="sm"
              disabled={formIsSubmitting || !canSubmit}
            >
              {formIsSubmitting
                ? heartbeat
                  ? "Updating..."
                  : "Creating..."
                : heartbeat
                  ? "Update"
                  : "Create"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
