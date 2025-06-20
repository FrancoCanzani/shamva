import { PublicMonitor } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/status/$slug";
import StatusPagePasswordForm from "../status-page/status-page-password-form";
import StatusPageUptimeChart from "../status-page/status-page-uptime-chart";

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
      <div className="relative z-10 max-w-5xl mx-auto bg-transparent min-h-screen">
        <div className="absolute left-0 top-0 h-full w-[2px] border-l border-dashed"></div>
        <div className="absolute right-0 top-0 h-full w-[2px] border-r border-dashed"></div>

        <header className="flex justify-between items-center p-6 border-b bg-white">
          <div className="flex items-center gap-2">
            <span className="uppercase text-sm">{data.title}</span>
          </div>
          <div className="text-xs uppercase">LIVE STATUS</div>
        </header>

        <div className="px-6 space-y-8">
          <section className="pt-8">
            <div className="border p-6">
              <div className="text-center">
                <h1 className="text-2xl  uppercase mb-4 text-black">
                  {data.title}
                </h1>
                {data.description && (
                  <p className="text-sm mb-6">{data.description}</p>
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
            <h2 className="text-lg uppercase mb-6  text-black">SERVICES</h2>
            <div className="space-y-4">
              {data.monitors.map((monitor) => (
                <div key={monitor.id} className="border hover:bg-slate-50">
                  <div className="border-l-2 py-6 px-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start flex-col space-y-2">
                        <h3 className="uppercase text-sm text-black">
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
                        <div className="text-xs uppercase text-black mb-2">
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
              <h2 className="text-lg uppercase mb-6 text-black">SUMMARY</h2>
              <div className="border">
                <div>
                  <div className="flex justify-between items-center p-4">
                    <h3 className="text-xs uppercase  text-black w-1/3">
                      SERVICES ONLINE
                    </h3>
                    <div className="text-xs w-2/3 text-right">
                      {
                        data.monitors.filter((m) => m.status === "active")
                          .length
                      }{" "}
                      / {data.monitors.length}
                    </div>
                  </div>
                </div>
                <div className="border-t">
                  <div className="flex justify-between items-center p-4">
                    <h3 className="text-xs uppercase text-black w-1/3">
                      AVERAGE UPTIME
                    </h3>
                    <div className="text-xs w-2/3 text-right">
                      {avgUptime.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="border-t">
                  <div className="flex justify-between items-center p-4">
                    <h3 className="text-xs uppercase  text-black w-1/3">
                      AVG RESPONSE TIME
                    </h3>
                    <div className="text-xs w-2/3 text-right">
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

        <footer className="p-6 mt-8 border-t bg-white">
          <p className="text-xs text-muted-foreground">
            © POWERED BY BLINKS. ALL RIGHTS RESERVED {new Date().getFullYear()}
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
