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

export default function MonitorsCardAvailabilityDisplay({
  label,
  availability,
}: AvailabilityDisplayProps) {
  const formattedPercentage =
    availability.total > 0 ? `${availability.percentage.toFixed()}%` : "-";

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "text-xs font-mono",
              availability.percentage < 95 && availability.total > 0
                ? "text-red-700"
                : availability.percentage < 100 && availability.total > 0
                  ? "text-yellow-700 dark:text-yellow-300"
                  : "text-green-700"
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
