interface StatusIndicatorProps {
  status: "active" | "warning" | "error" | "initializing" | "broken";
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return <span className={`h-3 w-3`} title={status}></span>;
}
