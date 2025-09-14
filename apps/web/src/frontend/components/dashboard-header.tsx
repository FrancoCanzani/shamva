import { cn } from "../lib/utils";
import { DashboardBreadcrumbs } from "./dashboard-breadcrumbs";
import { SidebarTrigger } from "./ui/sidebar";

export default function DashboardHeader({
  children,
  title,
  showBreadcrumbs = true,
  className,
}: {
  children?: React.ReactNode;
  title?: string;
  showBreadcrumbs?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "dark:bg-background sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-dashed bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60",
        className
      )}
    >
      <SidebarTrigger />

      {showBreadcrumbs ? (
        <DashboardBreadcrumbs />
      ) : (
        title && <h2 className="font-medium tracking-tight">{title}</h2>
      )}

      <div className="inline-flex flex-1 justify-end">{children}</div>
    </header>
  );
}
