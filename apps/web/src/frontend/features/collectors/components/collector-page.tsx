import DashboardHeader from "@/frontend/components/dashboard-header";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/collectors/$id";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { cn } from "@/frontend/lib/utils"; 

export default function CollectorPage() {
  const collectorData = Route.useLoaderData();
  const { days } = Route.useSearch();

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title={`Dashboard / Collectors / ${collectorData.name}`}>
      </DashboardHeader>

      <main className="relative flex-1 overflow-auto">
        <div className="mx-auto h-max max-w-6xl flex-1 space-y-8 overflow-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{collectorData.name}</h2>
                <p className="text-muted-foreground mt-1">
                  System metrics collector
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={collectorData.is_active ? "default" : "secondary"}
                  className={cn(
                    collectorData.is_active 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  )}
                >
                  {collectorData.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {collectorData.last_metric && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Hostname</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold font-mono">
                      {collectorData.last_metric.hostname}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Platform</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold capitalize">
                      {collectorData.last_metric.platform}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Last Seen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {new Date(collectorData.last_metric.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {Math.floor(collectorData.last_metric.uptime_seconds / 3600)}h
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Current Metrics */}
          {collectorData.last_metric && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current System Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {collectorData.last_metric.cpu_percent.toFixed(1)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            collectorData.last_metric.cpu_percent <= 50 
                              ? "bg-green-500" 
                              : collectorData.last_metric.cpu_percent <= 80 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(collectorData.last_metric.cpu_percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {collectorData.last_metric.memory_percent.toFixed(1)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            collectorData.last_metric.memory_percent <= 70 
                              ? "bg-green-500" 
                              : collectorData.last_metric.memory_percent <= 90 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(collectorData.last_metric.memory_percent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {collectorData.last_metric.memory_used_gb.toFixed(1)}GB / {collectorData.last_metric.memory_total_gb.toFixed(1)}GB
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {collectorData.last_metric.disk_percent.toFixed(1)}%
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            collectorData.last_metric.disk_percent <= 70 
                              ? "bg-green-500" 
                              : collectorData.last_metric.disk_percent <= 90 
                                ? "bg-yellow-500" 
                                : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(collectorData.last_metric.disk_percent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {collectorData.last_metric.disk_free_gb.toFixed(1)}GB free
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sent:</span>
                        <span className="font-mono">
                          {collectorData.last_metric.network_sent_mb.toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Received:</span>
                        <span className="font-mono">
                          {collectorData.last_metric.network_recv_mb.toFixed(1)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Speed:</span>
                        <span className="font-mono">
                          {collectorData.last_metric.network_sent_mbps.toFixed(1)} Mbps
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top Process</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium truncate">
                        {collectorData.last_metric.top_process_name}
                      </p>
                      <p className="text-2xl font-bold">
                        {collectorData.last_metric.top_process_cpu.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {collectorData.last_metric.total_processes.toLocaleString()} total processes
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">System Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {collectorData.last_metric.temperature_celsius > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Temperature:</span>
                          <span className="font-mono">
                            {collectorData.last_metric.temperature_celsius.toFixed(1)}°C
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Power:</span>
                        <span className="font-mono capitalize">
                          {collectorData.last_metric.power_status}
                        </span>
                      </div>
                      {collectorData.last_metric.battery_percent > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Battery:</span>
                          <span className="font-mono">
                            {collectorData.last_metric.battery_percent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Historical Metrics */}
          {collectorData.metrics && collectorData.metrics.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Historical Data (Last {days} days)</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Metrics History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Timestamp</th>
                          <th className="text-left py-2">CPU</th>
                          <th className="text-left py-2">Memory</th>
                          <th className="text-left py-2">Disk</th>
                          <th className="text-left py-2">Load</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collectorData.metrics.slice(0, 20).map((metric: Metric) => (
                          <tr key={metric.id} className="border-b">
                            <td className="py-2 font-mono text-xs">
                              {new Date(metric.created_at).toLocaleString()}
                            </td>
                            <td className="py-2">{metric.cpu_percent.toFixed(1)}%</td>
                            <td className="py-2">{metric.memory_percent.toFixed(1)}%</td>
                            <td className="py-2">{metric.disk_percent.toFixed(1)}%</td>
                            <td className="py-2">{metric.load_avg_1.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
