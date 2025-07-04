import { cn } from "@/frontend/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-xs", className)}
      {...props}
    />
  );
}

export { Skeleton };
