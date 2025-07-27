import Loading from "@/frontend/components/loading";
import fetchMonitor from "@/frontend/features/monitors/api/monitor";
import MonitorPage from "@/frontend/features/monitors/components/monitor-page";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const MonitorSearchSchema = z.object({
  days: z.number().int().min(1).max(14).default(7),
  region: z.string().optional(),
  splitRegions: z.boolean().optional(),
});

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/$id/")(
  {
    component: MonitorPage,
    pendingComponent: Loading,
    validateSearch: (search) => MonitorSearchSchema.parse(search),
    loaderDeps: ({ search: { days } }) => ({ days }),
    loader: ({ params, context, deps: { days } }) =>
      fetchMonitor({ params, context, days }),
  }
);
