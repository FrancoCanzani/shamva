interface StatusIndicatorProps {
  status: "active" | "warning" | "error" | "initializing" | "broken";
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <span className={`status-indicator status-${status}`} title={status} />
  );
}
