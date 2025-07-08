import { HeartbeatSchema } from "@/frontend/lib/schemas";
import type { Heartbeat } from "@/frontend/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Check, Copy } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface HeartbeatFormData {
  name: string;
  expected_lapse_ms: number;
  grace_period_ms: number;
  workspace_id: string;
}

interface HeartbeatFormProps {
  workspaceId: string;
  heartbeat?: Heartbeat;
  onSubmit: (data: HeartbeatFormData) => Promise<void>;
  onCancel: () => void;
}

const timeUnits = [
  { value: 1000, label: "seconds" },
  { value: 60000, label: "minutes" },
  { value: 3600000, label: "hours" },
  { value: 86400000, label: "days" },
];

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function HeartbeatForm({
  workspaceId,
  heartbeat,
  onSubmit,
  onCancel,
}: HeartbeatFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [heartbeatId] = useState(() => heartbeat?.id || generateUUID());

  const getTimeValueAndUnit = (ms: number) => {
    for (let i = timeUnits.length - 1; i >= 0; i--) {
      const unit = timeUnits[i];
      if (ms % unit.value === 0) {
        return { value: ms / unit.value, unit: unit.value };
      }
    }
    return { value: ms / 1000, unit: 1000 };
  };

  const expectedLapse = getTimeValueAndUnit(
    heartbeat?.expected_lapse_ms || 60000
  );
  const gracePeriod = getTimeValueAndUnit(heartbeat?.grace_period_ms || 10000);

  const [expectedValue, setExpectedValue] = useState(expectedLapse.value);
  const [expectedUnit, setExpectedUnit] = useState(expectedLapse.unit);
  const [graceValue, setGraceValue] = useState(gracePeriod.value);
  const [graceUnit, setGraceUnit] = useState(gracePeriod.unit);

  const form = useForm<HeartbeatFormData>({
    resolver: zodResolver(HeartbeatSchema),
    defaultValues: {
      name: heartbeat?.name || "",
      expected_lapse_ms: heartbeat?.expected_lapse_ms || 60000,
      grace_period_ms: heartbeat?.grace_period_ms || 10000,
      workspace_id: workspaceId,
    },
  });

  const apiEndpoint = `https://api.yourapp.com/ping/${heartbeatId}`;

  const handleSubmit = async (data: HeartbeatFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const submitData = {
        ...data,
        expected_lapse_ms: expectedValue * expectedUnit,
        grace_period_ms: graceValue * graceUnit,
      };
      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiEndpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {error && (
          <Alert variant="destructive" className="mb-4 rounded-xs">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium">What to monitor</h3>
              <p className="text-sm">
                Configure the name of the CRON job or a worker you want to
                monitor.
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Timing configuration</h3>
              <p className="text-sm">
                Set how often you expect to receive heartbeats and configure a
                grace period.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Heartbeat name</Label>
              <Input
                id="name"
                placeholder="Daily database backup"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-full text-sm">Expect a heartbeat every</span>
                <Input
                  type="number"
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(Number(e.target.value))}
                  min="1"
                />
                <Select
                  value={expectedUnit.toString()}
                  onValueChange={(value) => setExpectedUnit(Number(value))}
                >
                  <SelectTrigger className="capitalize">
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

              <div className="flex items-center gap-2 text-xs">
                <span className="w-full text-sm">With a grace period of</span>
                <Input
                  type="number"
                  value={graceValue}
                  onChange={(e) => setGraceValue(Number(e.target.value))}
                  min="1"
                />
                <Select
                  value={graceUnit.toString()}
                  onValueChange={(value) => setGraceUnit(Number(value))}
                >
                  <SelectTrigger className="capitalize">
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
            </div>
          </div>
        </div>
      </form>

      <div className="flex flex-col space-y-6">
        <div>
          <h3 className="mb-2 font-medium">API Endpoint</h3>
          <div className="space-y-2 text-sm">
            <Alert className="w-full border-dashed">
              <AlertCircleIcon />
              <AlertDescription>
                This endpoint will only be valid after saving. Monitoring starts
                when first pinged for sync.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className="rounded-xs border p-4">
          <div className="space-y-3">
            <Label className="font-medium">Ping URL</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xs border px-2 py-1">
                <code className="text-xs break-all">{apiEndpoint}</code>
              </div>
              <Button type="button" variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Create
        </Button>
      </div>
    </div>
  );
}
