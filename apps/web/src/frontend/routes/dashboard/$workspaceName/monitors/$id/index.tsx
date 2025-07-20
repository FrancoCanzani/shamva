import Loading from "@/frontend/components/loading";
import MonitorPage from "@/frontend/components/pages/monitor-page";
import fetchMonitor from "@/frontend/lib/loaders/monitor";
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
    loader: ({ params, abortController, deps: { days } }) =>
      fetchMonitor({ params, abortController, days }),
  }
);
