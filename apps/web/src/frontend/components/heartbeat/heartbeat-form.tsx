import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HeartbeatSchema } from "@/frontend/lib/schemas";
import type { Heartbeat } from "@/frontend/lib/types";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Alert,AlertDescription } from "@/frontend/components/ui/alert";
import { Loader2 } from "lucide-react";

interface HeartbeatFormProps {
  workspaceId: string;
  heartbeat?: Heartbeat;
  onSubmit: (data: { name: string; expected_lapse_ms: number; grace_period_ms: number; workspace_id: string }) => Promise<void>;
  onCancel: () => void;
}

export default function HeartbeatForm({ workspaceId, heartbeat, onSubmit, onCancel }: HeartbeatFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(HeartbeatSchema),
    defaultValues: {
      name: heartbeat?.name || "",
      expected_lapse_ms: heartbeat?.expected_lapse_ms || 60000, // 1 minute default
      grace_period_ms: heartbeat?.grace_period_ms || 10000, // 10 seconds default
      workspace_id: workspaceId,
    },
  });

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {heartbeat ? "Edit Heartbeat" : "Create New Heartbeat"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Heartbeat Name</Label>
            <Input
              id="name"
              placeholder="e.g., Database Health Check"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_lapse_ms">Expected Lapse (milliseconds)</Label>
            <Input
              id="expected_lapse_ms"
              type="number"
              placeholder="60000"
              {...form.register("expected_lapse_ms", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              How often the heartbeat should be received (e.g., 60000ms = 1 minute)
            </p>
            {form.formState.errors.expected_lapse_ms && (
              <p className="text-sm text-red-600">
                {form.formState.errors.expected_lapse_ms.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grace_period_ms">Grace Period (milliseconds)</Label>
            <Input
              id="grace_period_ms"
              type="number"
              placeholder="10000"
              {...form.register("grace_period_ms", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              Extra time before considering the heartbeat timed out (e.g., 10000ms = 10 seconds)
            </p>
            {form.formState.errors.grace_period_ms && (
              <p className="text-sm text-red-600">
                {form.formState.errors.grace_period_ms.message}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {heartbeat ? "Update Heartbeat" : "Create Heartbeat"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 