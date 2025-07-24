import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/$id";
export default function MonitorHeader() {
  const monitor = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-1">
      <h2 className="flex-1 text-2xl font-medium">{monitor.name}</h2>
      <span className="text-muted-foreground text-xs">
        <strong className="uppercase">{monitor.check_type}</strong> monitor for{" "}
        {monitor.check_type === "tcp" ? monitor.tcp_host_port : monitor.url}
      </span>
    </div>
  );
}
