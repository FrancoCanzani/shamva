import { Loader } from "lucide-react";
import { cn } from "../utils/utils";

export default function Loading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-1 items-center justify-center",
        className
      )}
    >
      <Loader className="animate-spin duration-75" />
    </div>
  );
}
