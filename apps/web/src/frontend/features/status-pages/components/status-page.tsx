import { Route } from "@/frontend/routes/status/$slug";
import { PublicMonitor } from "@/frontend/types/types";
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

export default function StatusPage() {
  const data = Route.useLoaderData();

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

  return (
    <div className="min-h-screen w-full font-mono">
      <div className="relative z-10 mx-auto min-h-screen max-w-5xl bg-transparent">
        <div className="absolute top-0 left-0 h-full w-[2px] border-l border-dashed"></div>
        <div className="absolute top-0 right-0 h-full w-[2px] border-r border-dashed"></div>

        <header className="flex items-center justify-between border-b bg-white p-6">
          <div className="flex items-center gap-2">
            <span className="text-sm uppercase">{data.title}</span>
          </div>
          <div className="text-xs uppercase">LIVE STATUS</div>
        </header>

        <div className="space-y-8 px-6">
          <section className="pt-8">
            <div className="border p-6">
              <div className="text-center">
                <h1 className="mb-4 text-2xl text-black uppercase">
                  {data.title}
                </h1>
                {data.description && (
                  <p className="mb-6 text-sm">{data.description}</p>
                )}
                <div className="inline-flex items-center gap-3 border p-3">
                  <span className="text-sm font-medium uppercase">
                    {overallStatus.text}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-lg text-black uppercase">SERVICES</h2>
            <div className="space-y-4">
              {data.monitors.map((monitor) => (
                <div key={monitor.id} className="border hover:bg-stone-50">
                  <div className="border-l-2 px-6 py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col items-start space-y-2">
                        <h3 className="text-sm text-black uppercase">
                          {monitor.name}
                        </h3>

                        {data.show_values && monitor.daily_stats && (
                          <StatusPageUptimeChart
                            monitor={monitor}
                            showValues={data.show_values}
                          />
                        )}
                      </div>

                      <div className="text-right">
                        <div className="mb-2 text-xs text-black uppercase">
                          {getStatusText(monitor.status)}
                        </div>
                        {data.show_values &&
                          monitor.uptime_percentage !== undefined && (
                            <div className="space-y-2">
                              <div className="text-xs">
                                {monitor.uptime_percentage.toFixed(1)}% UPTIME
                              </div>
                              {monitor.avg_response_time !== undefined && (
                                <div className="text-xs">
                                  {monitor.avg_response_time}MS AVG
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {data.show_values && (
            <section>
              <h2 className="mb-6 text-lg text-black uppercase">SUMMARY</h2>
              <div className="border">
                <div>
                  <div className="flex items-center justify-between p-4">
                    <h3 className="w-1/3 text-xs text-black uppercase">
                      SERVICES ONLINE
                    </h3>
                    <div className="w-2/3 text-right text-xs">
                      {
                        data.monitors.filter((m) => m.status === "active")
                          .length
                      }{" "}
                      / {data.monitors.length}
                    </div>
                  </div>
                </div>
                <div className="border-t">
                  <div className="flex items-center justify-between p-4">
                    <h3 className="w-1/3 text-xs text-black uppercase">
                      AVERAGE UPTIME
                    </h3>
                    <div className="w-2/3 text-right text-xs">
                      {avgUptime.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="border-t">
                  <div className="flex items-center justify-between p-4">
                    <h3 className="w-1/3 text-xs text-black uppercase">
                      AVG RESPONSE TIME
                    </h3>
                    <div className="w-2/3 text-right text-xs">
                      {Math.round(
                        data.monitors.reduce(
                          (sum, m) => sum + (m.avg_response_time || 0),
                          0
                        ) / data.monitors.length
                      )}
                      MS
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <footer className="mt-8 border-t bg-white p-6">
          <p className="text-muted-foreground text-xs">
            © POWERED BY BLINKS. ALL RIGHTS RESERVED {new Date().getFullYear()}
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
