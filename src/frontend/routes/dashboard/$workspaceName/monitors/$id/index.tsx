import MonitorPage from "@/frontend/components/pages/monitor-page";
import fetchMonitor from "@/frontend/lib/loaders/monitor";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const MonitorSearchSchema = z.object({
  days: z.number().default(30),
});

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/$id/")(
  {
    component: MonitorPage,
    validateSearch: (search) => MonitorSearchSchema.parse(search),
    loader: ({ params, abortController }) =>
      fetchMonitor({ params, abortController }),
  },
);
