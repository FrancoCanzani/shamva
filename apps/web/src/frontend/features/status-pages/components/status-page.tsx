import { PublicMonitor } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/status/$slug";
import { useState } from "react";
import StatusPagePasswordForm from "./status-page/status-page-password-form";
import StatusPageUptimeChart from "./status-page/status-page-uptime-chart";

function getStatusText(status: string) {
  switch (status) {
    case "active":
      return "OPERATIONAL";
    case "degraded":
      return "DEGRADED";
    case "error":
    case "broken":
      return "DOWN";
    case "maintenance":
      return "MAINTENANCE";
    default:
      return "UNKNOWN";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "text-green-600";
    case "degraded":
      return "text-yellow-600";
    case "error":
    case "broken":
      return "text-red-600";
    case "maintenance":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
}

function getOverallStatus(monitors: PublicMonitor[]) {
  if (monitors.length === 0) {
    return { status: "unknown", text: "NO SERVICES" };
  }

  const hasError = monitors.some(
    (m) => m.status === "error" || m.status === "broken"
  );
  const hasMaintenance = monitors.some((m) => m.status === "maintenance");

  if (hasError) {
    return { status: "error", text: "OUTAGE" };
  }

  if (hasMaintenance) {
    return { status: "maintenance", text: "UNDER MAINTENANCE" };
  }

  return {
    status: "operational",
    text: "ALL SYSTEMS OPERATIONAL",
  };
}

function groupMonitorsByCategory(monitors: PublicMonitor[]) {
  const groups: Record<string, PublicMonitor[]> = {};

  monitors.forEach((monitor) => {
    // Use the category field if available, otherwise infer from name
    const category =
      monitor.category ||
      (monitor.name.includes("API")
        ? "API"
        : monitor.name.includes("Frontend")
          ? "Frontend"
          : monitor.name.includes("Docs")
            ? "Documentation"
            : monitor.name.includes("Database")
              ? "Database"
              : "Services");

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(monitor);
  });

  return groups;
}

type TabType = "status" | "incidents" | "monitors";

export default function StatusPage() {
  const data = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<TabType>("status");

  if (data.needsPassword) {
    return <StatusPagePasswordForm slug={data.slug} onSuccess={() => {}} />;
  }

  const overallStatus = getOverallStatus(data.monitors);
  const avgUptime =
    data.monitors
      .filter((m: PublicMonitor) => m.uptime_percentage !== undefined)
      .reduce(
        (sum: number, m: PublicMonitor) => sum + (m.uptime_percentage || 0),
        0
      ) /
    Math.max(
      data.monitors.filter(
        (m: PublicMonitor) => m.uptime_percentage !== undefined
      ).length,
      1
    );

  const monitorGroups = groupMonitorsByCategory(data.monitors);
  const currentTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.title}
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex space-x-1">
              {[
                { id: "status", label: "Status" },
                { id: "incidents", label: "Events" },
                { id: "monitors", label: "Monitors" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-8">
          {activeTab === "status" && (
            <div className="space-y-8">
              {/* Status Overview */}
              <section>
                <div className="text-center">
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {data.title}
                  </h1>
                  {data.description && (
                    <p className="mb-6 text-gray-600 dark:text-gray-400">
                      {data.description}
                    </p>
                  )}

                  {/* Status Banner */}
                  <div
                    className={`inline-flex items-center gap-3 rounded-lg border-2 px-6 py-4 ${
                      overallStatus.status === "operational"
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                        : overallStatus.status === "error"
                          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${
                        overallStatus.status === "operational"
                          ? "bg-green-500"
                          : overallStatus.status === "error"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {overallStatus.text}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {currentTime}
                  </div>
                </div>
              </section>

              {/* Services by Category */}
              <section>
                <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                  Services
                </h2>
                <div className="space-y-8">
                  {Object.entries(monitorGroups).map(([category, monitors]) => (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {category}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {monitors.filter((m) => m.status === "active").length}{" "}
                          / {monitors.length} operational
                        </div>
                      </div>

                      <div className="space-y-3">
                        {monitors.map((monitor) => (
                          <div
                            key={monitor.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {monitor.name}
                                  </h4>
                                  <div
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                      monitor.status === "active"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : monitor.status === "degraded"
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                  >
                                    <div
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        monitor.status === "active"
                                          ? "bg-green-500"
                                          : monitor.status === "degraded"
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                      }`}
                                    />
                                    {getStatusText(monitor.status)}
                                  </div>
                                </div>

                                {data.show_values && monitor.daily_stats && (
                                  <div className="mt-3">
                                    <StatusPageUptimeChart
                                      monitor={monitor}
                                      showValues={data.show_values}
                                    />
                                  </div>
                                )}
                              </div>

                              {data.show_values && (
                                <div className="text-right">
                                  {monitor.uptime_percentage !== undefined && (
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {monitor.uptime_percentage.toFixed(1)}%
                                      uptime
                                    </div>
                                  )}
                                  {monitor.avg_response_time !== undefined && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {monitor.avg_response_time}ms avg
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Summary */}
              {data.show_values && (
                <section>
                  <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                    Summary
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Services Online
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {
                          data.monitors.filter((m) => m.status === "active")
                            .length
                        }{" "}
                        / {data.monitors.length}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Average Uptime
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {avgUptime.toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Avg Response Time
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(
                          data.monitors.reduce(
                            (sum, m) => sum + (m.avg_response_time || 0),
                            0
                          ) / data.monitors.length
                        )}
                        ms
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === "incidents" && (
            <div className="py-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <div className="mb-4 text-4xl">📋</div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  No recent reports
                </h3>
                <p className="text-sm">
                  There have been no incidents within the last 7 days.
                </p>
              </div>
            </div>
          )}

          {activeTab === "monitors" && (
            <div className="py-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <div className="mb-4 text-4xl">📊</div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  Monitor Performance
                </h3>
                <p className="text-sm">
                  Detailed performance metrics will be available here.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by Shamva
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
