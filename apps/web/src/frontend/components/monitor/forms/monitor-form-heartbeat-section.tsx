import { cn } from "@/frontend/lib/utils";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";

interface MonitorFormHeartbeatSectionProps {
  className?: string;
}

export function MonitorFormHeartbeatSection({
  className,
}: MonitorFormHeartbeatSectionProps) {
  const { control, watch, setValue } = useFormContext();
  const enableHeartbeat = watch("enableHeartbeat");

  const generateHeartbeatId = () => {
    const id = `heartbeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setValue("heartbeatId", id);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h2 className="font-medium">Heartbeat Monitoring</h2>
      <p className="text-sm text-muted-foreground">
        Configure heartbeat monitoring to track if your service is actively sending heartbeats.
        This is useful for services that should be continuously running.
      </p>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Controller
            control={control}
            name="enableHeartbeat"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="enableHeartbeat">Enable heartbeat monitoring</Label>
        </div>

        {enableHeartbeat && (
          <div className="space-y-4 pl-6 border-l-2 border-muted">
            <div className="space-y-2">
              <Label htmlFor="heartbeatId">Heartbeat ID</Label>
              <div className="flex gap-2">
                <Input
                  id="heartbeatId"
                  placeholder="Enter a unique heartbeat ID"
                  className="flex-1"
                  {...control.register("heartbeatId")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateHeartbeatId}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This ID will be used to identify heartbeats from your service.
                External services should ping: /api/heartbeat?id=YOUR_HEARTBEAT_ID
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heartbeatTimeout">Timeout (seconds)</Label>
              <Controller
                control={control}
                name="heartbeatTimeoutSeconds"
                render={({ field }) => (
                  <Input
                    id="heartbeatTimeout"
                    type="number"
                    min="30"
                    max="3600"
                    placeholder="300"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 300)}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                How long to wait before considering the heartbeat dead (30-3600 seconds)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heartbeatInstructions">Integration Instructions</Label>
              <Textarea
                id="heartbeatInstructions"
                readOnly
                value={`// Your service should send heartbeats to:
// GET https://your-domain.com/api/heartbeat?id=${watch("heartbeatId") || "YOUR_HEARTBEAT_ID"}&service=YourServiceName

// Example with curl:
// curl "https://your-domain.com/api/heartbeat?id=${watch("heartbeatId") || "YOUR_HEARTBEAT_ID"}&service=YourServiceName"

// Example with JavaScript:
// fetch("https://your-domain.com/api/heartbeat?id=${watch("heartbeatId") || "YOUR_HEARTBEAT_ID"}&service=YourServiceName")

// Send heartbeats more frequently than the timeout to ensure reliability.`}
                className="font-mono text-xs"
                rows={8}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 