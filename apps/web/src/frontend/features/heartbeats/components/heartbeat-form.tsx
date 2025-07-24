import { Button } from "@/frontend/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/frontend/components/ui/form";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { HeartbeatSchema } from "@/frontend/lib/schemas";
import { Heartbeat } from "@/frontend/types/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

  const form = useForm<z.infer<typeof HeartbeatSchema>>({
    resolver: zodResolver(HeartbeatSchema),
    defaultValues: {
      name: heartbeat?.name || "",
      expectedLapseMs: heartbeat?.expected_lapse_ms || 60000,
      gracePeriodMs: heartbeat?.grace_period_ms || 10000,
      workspaceId: workspaceId,
      pingId: heartbeat?.ping_id || pingId,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="pingId"
          render={({ field }) => <input type="hidden" {...field} />}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heartbeat name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Daily database backup"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A descriptive name for your heartbeat monitor
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="expectedLapseMs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Expected heartbeat interval
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <span className="text-sm whitespace-nowrap">
                            Every
                          </span>
                          <Input
                            type="number"
                            value={getTimeValueAndUnit(field.value).value}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              const unit = getTimeValueAndUnit(
                                field.value
                              ).unit;
                              const ms = value * unit;
                              field.onChange(ms);
                            }}
                            min="1"
                            className="w-24"
                          />
                          <Select
                            value={getTimeValueAndUnit(
                              field.value
                            ).unit.toString()}
                            onValueChange={(value) => {
                              const unit = Number(value);
                              const currentValue = getTimeValueAndUnit(
                                field.value
                              ).value;
                              const ms = currentValue * unit;
                              field.onChange(ms);
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="gracePeriodMs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Grace period</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <span className="text-sm whitespace-nowrap">
                            Allow
                          </span>
                          <Input
                            type="number"
                            value={getTimeValueAndUnit(field.value).value}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              const unit = getTimeValueAndUnit(
                                field.value
                              ).unit;
                              const ms = value * unit;
                              field.onChange(ms);
                            }}
                            min="1"
                            className="w-24"
                          />
                          <Select
                            value={getTimeValueAndUnit(
                              field.value
                            ).unit.toString()}
                            onValueChange={(value) => {
                              const unit = Number(value);
                              const currentValue = getTimeValueAndUnit(
                                field.value
                              ).value;
                              const ms = currentValue * unit;
                              field.onChange(ms);
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
                          <span className="text-sm whitespace-nowrap">
                            delay
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm">
                        Additional time allowed before triggering an alert
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? heartbeat
                ? "Updating..."
                : "Creating..."
              : heartbeat
                ? "Update"
                : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
