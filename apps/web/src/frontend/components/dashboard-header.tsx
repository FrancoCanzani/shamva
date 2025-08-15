import { cn } from "../utils/utils";
import { SidebarTrigger } from "./ui/sidebar";

export default function DashboardHeader({
  children,
  title,
  className,
}: {
  children?: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "dark:bg-background sticky top-0 z-30 flex items-center gap-2 bg-white/80 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/60",
        className
      )}
    >
      <SidebarTrigger />

      <h2 className="font-medium tracking-tight">{title}</h2>

      <div className="inline-flex flex-1 justify-end">{children}</div>
    </header>
  );
}
