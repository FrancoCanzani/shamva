import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { cn } from "@/frontend/lib/utils";

interface AvailabilityDisplayProps {
  label: string;
  availability: { percentage: number; success: number; total: number };
}

export default function MonitorsTableRowAvailabilityDisplay({
  label,
  availability,
}: AvailabilityDisplayProps) {
  const formattedPercentage =
    availability.total > 0 ? `${availability.percentage.toFixed()}%` : "N/A";

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "text-sm font-medium font-mono",
              availability.percentage < 95 && availability.total > 0
                ? "text-red-600"
                : availability.percentage < 100 && availability.total > 0
                  ? "text-yellow-600"
                  : "text-gray-700",
            )}
          >
            {formattedPercentage}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>
            {label}: {availability.success} successful / {availability.total}{" "}
            checks
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
