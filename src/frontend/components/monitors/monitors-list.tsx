import { Monitor } from "@/frontend/lib/types";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { StatusIndicator } from "./status-indicator";

import { ChevronRight, LayoutGrid, LayoutList } from "lucide-react";

interface MonitorsListProps {
  monitors: Monitor[];
}

export function MonitorsList({ monitors }: MonitorsListProps) {
  const [viewMode, setViewMode] = useState<"line" | "grid">("line");

  const activeMonitors = monitors.filter((m) => m.status === "active");
  const issueMonitors = monitors.filter((m) =>
    ["warning", "error", "broken", "initializing"].includes(m.status),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
          <h2 className="text-base font-semibold flex items-center gap-2">
            Active monitors{" "}
            <span className="text-sm font-normal text-gray-500">
              {activeMonitors.length}
            </span>
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort:</span>
              <select className="text-sm font-medium bg-transparent border-none appearance-none pr-6 cursor-pointer">
                <option>Newest</option>
                <option>Oldest</option>
                <option>URL</option>
              </select>
            </div>

            <div className="flex border border-gray-200 rounded-md overflow-hidden">
              <button
                className={`flex items-center justify-center p-1.5 ${
                  viewMode === "line"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500"
                }`}
                onClick={() => setViewMode("line")}
              >
                <LayoutList size={18} />
                <span className="sr-only">Line</span>
              </button>
              <button
                className={`flex items-center justify-center p-1.5 ${
                  viewMode === "grid"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={18} />
                <span className="sr-only">Grid</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr_0.5fr] px-6 py-3 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div>Endpoint</div>
            <div>Method</div>
            <div>Success / Failure</div>
            <div>Last check</div>
            <div></div>
          </div>

          {activeMonitors.map((monitor) => (
            <Link
              to="/dashboard/monitors/$slug"
              params={{ slug: monitor.id }}
              key={monitor.id}
              className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr_0.5fr] px-6 py-4 border-b border-gray-200 items-center hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 font-medium">
                <StatusIndicator status={monitor.status} />
                <span className="truncate">{monitor.url}</span>
              </div>
              <div className="text-sm">{monitor.method}</div>
              <div className="flex flex-col gap-1">
                <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(monitor.success_count / (monitor.success_count + monitor.failure_count || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {monitor.success_count} / {monitor.failure_count}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {monitor.last_check_at
                  ? new Date(monitor.last_check_at).toLocaleDateString()
                  : "Never"}
              </div>
              <div className="flex justify-end">
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Issues Monitors Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
          <h2 className="text-base font-semibold flex items-center gap-2">
            Monitors with issues{" "}
            <span className="text-sm font-normal text-gray-500">
              {issueMonitors.length}
            </span>
          </h2>

          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <button
              className={`flex items-center justify-center p-1.5 ${
                viewMode === "line"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500"
              }`}
              onClick={() => setViewMode("line")}
            >
              <LayoutList size={18} />
              <span className="sr-only">Line</span>
            </button>
            <button
              className={`flex items-center justify-center p-1.5 ${
                viewMode === "grid"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={18} />
              <span className="sr-only">Grid</span>
            </button>
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr_0.5fr] px-6 py-3 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div>Endpoint</div>
            <div>Method</div>
            <div>Status</div>
            <div>Last check</div>
            <div></div>
          </div>

          {issueMonitors.map((monitor) => (
            <Link
              to="/dashboard/monitors/$slug"
              params={{ slug: monitor.id }}
              key={monitor.id}
              className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr_0.5fr] px-6 py-4 border-b border-gray-200 items-center hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 font-medium">
                <StatusIndicator status={monitor.status} />
                <span className="truncate">{monitor.url}</span>
              </div>
              <div className="text-sm">{monitor.method}</div>
              <div>
                <span
                  className={`inline-flex text-xs font-medium px-2 py-1 rounded ${
                    monitor.status === "warning"
                      ? "bg-amber-50 text-amber-500"
                      : monitor.status === "error"
                        ? "bg-red-50 text-red-500"
                        : monitor.status === "initializing"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {monitor.status.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {monitor.last_check_at
                  ? new Date(monitor.last_check_at).toLocaleDateString()
                  : "Never"}
              </div>
              <div className="flex justify-end">
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
