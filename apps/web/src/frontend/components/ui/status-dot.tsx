import { cn } from "@/frontend/utils/utils";
interface StatusDotProps {
  color: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export function StatusDot({
  color,
  size = "md",
  pulse = false,
  className,
}: StatusDotProps) {
  const sizeClass = sizeConfig[size];

  if (pulse) {
    return (
      <div className="relative">
        <div
          className={cn(
            "rounded-full",
            sizeClass,
            color,
            "animate-ping",
            className
          )}
        />
        <div
          className={cn(
            "rounded-full",
            sizeClass,
            color,
            "absolute inset-0",
            className
          )}
        />
      </div>
    );
  }

  return <div className={cn("rounded-full", sizeClass, color, className)} />;
}
