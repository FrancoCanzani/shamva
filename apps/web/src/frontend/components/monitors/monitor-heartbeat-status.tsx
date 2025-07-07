import { Badge } from "@/frontend/components/ui/badge";
import { cn } from "@/frontend/lib/utils";

interface HeartbeatStatusProps {
  heartbeatId?: string;
  lastBeatAt?: string;
  timeoutSeconds?: number;
  className?: string;
}

export default function MonitorHeartbeatStatus({
  heartbeatId,
  lastBeatAt,
  timeoutSeconds = 300,
  className,
}: HeartbeatStatusProps) {
  if (!heartbeatId) {
    return null;
  }

  const now = new Date();
  const lastBeat = lastBeatAt ? new Date(lastBeatAt) : null;
  const timeoutMs = timeoutSeconds * 1000;
  
  const isAlive = lastBeat && (now.getTime() - lastBeat.getTime()) < timeoutMs;
  const timeSinceLastBeat = lastBeat ? now.getTime() - lastBeat.getTime() : null;
  const timeUntilTimeout = lastBeat ? timeoutMs - timeSinceLastBeat! : null;

  const getStatusColor = () => {
    if (!lastBeat) return "bg-gray-500";
    if (isAlive) return "bg-green-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (!lastBeat) return "No heartbeat";
    if (isAlive) return "Alive";
    return "Dead";
  };

  const getTimeDisplay = () => {
    if (!lastBeat) return "Never";
    
    const seconds = Math.floor(timeSinceLastBeat! / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
      
      {lastBeat && (
        <div className="text-xs text-muted-foreground">
          Last beat: {getTimeDisplay()}
        </div>
      )}
      
      {isAlive && timeUntilTimeout && (
        <div className="text-xs text-muted-foreground">
          Timeout in: {Math.floor(timeUntilTimeout / 1000)}s
        </div>
      )}
      
      <Badge variant="outline" className="text-xs">
        {heartbeatId}
      </Badge>
    </div>
  );
} 