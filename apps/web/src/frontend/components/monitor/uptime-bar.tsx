import type { Log } from "@/frontend/lib/types";

export type UptimeStatus = "success" | "error" | "degraded";

export interface UptimeBarProps {
  log: Partial<Log>[];
  blockSize?: number;
}

const STATUS_COLORS: Record<UptimeStatus, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  degraded: "bg-yellow-400",
};

const STATUS_LABELS: Record<UptimeStatus, string> = {
  success: "Success",
  error: "Error",
  degraded: "Degraded",
};

function getStatus(log: Partial<Log>): UptimeStatus {
  if (log.ok === true) return "success";
  if (log.ok === false) {
    // Optionally, treat 5xx as error, 4xx as degraded
    if (typeof log.status_code === "number" && log.status_code >= 400 && log.status_code < 500) {
      return "degraded";
    }
    return "error";
  }
  return "degraded"; // fallback for missing data
}

export function UptimeBar({ log, blockSize = 16 }: UptimeBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-end gap-0.5 overflow-x-auto py-2">
        {log.map((item, i) => (
          <div
            key={(item.id ?? item.created_at ?? i) + "-" + i}
            className={`rounded ${STATUS_COLORS[getStatus(item)]}`}
            style={{ width: blockSize, height: 40 }}
            title={
              item.created_at
                ? new Date(item.created_at).toLocaleString()
                : undefined
            }
          />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${color}`} />
            <span>{STATUS_LABELS[status as UptimeStatus]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UptimeBar;