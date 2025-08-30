import { Badge } from "@/frontend/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { Metric } from "../../types";

interface CollectorHeaderProps {
  name: string;
  isActive: boolean;
  metrics: Metric[];
}

export default function CollectorHeader({
  name,
  isActive,
  metrics,
}: CollectorHeaderProps) {
  const lastMetric = metrics[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex-1 text-xl font-medium">{name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? "outline" : "destructive"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-muted-foreground mb-1 text-xs font-medium">
            System
          </h4>
          <div className="inline-flex items-end space-x-1.5">
            <p className="font-mono text-sm font-medium">
              {lastMetric.hostname}
            </p>
            <p className="text-muted-foreground text-xs capitalize">
              {lastMetric.platform}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div>
            <h4 className="text-muted-foreground mb-1 text-xs font-medium">
              Last Seen
            </h4>
            <p className="text-sm font-medium">
              {formatDistanceToNowStrict(new Date(lastMetric.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>

          <div>
            <h4 className="text-muted-foreground mb-1 text-xs font-medium">
              Uptime
            </h4>
            <p className="text-sm font-medium">
              {Math.floor(lastMetric.uptime_seconds / 3600)}h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
