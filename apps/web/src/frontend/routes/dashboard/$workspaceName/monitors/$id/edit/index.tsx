import fetchMonitor from "@/frontend/features/monitors/api/monitor";
import EditMonitorPage from "@/frontend/features/monitors/components/edit-monitor-page";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const MonitorSearchSchema = z.object({
  days: z.number().int().min(1).max(14).default(7),
});

export const Route = createFileRoute(
  "/dashboard/$workspaceName/monitors/$id/edit/"
)({
  component: EditMonitorPage,
  validateSearch: (search) => MonitorSearchSchema.parse(search),
  loaderDeps: ({ search: { days } }) => ({ days }),
  loader: ({ params, context, deps: { days } }) =>
    fetchMonitor({ params, context, days }),
});
