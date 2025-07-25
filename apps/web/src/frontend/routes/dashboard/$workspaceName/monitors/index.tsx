import Loading from "@/frontend/components/loading";
import { fetchMonitors } from "@/frontend/features/monitors/api/monitors";
import MonitorsPage from "@/frontend/features/monitors/components/monitors-page";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const MonitorsSearchSchema = z.object({});

export type MonitorsSearch = z.infer<typeof MonitorsSearchSchema>;

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/")({
  validateSearch: (search) => MonitorsSearchSchema.parse(search),
  loader: ({ params, abortController }) =>
    fetchMonitors({ params, abortController }),
  staleTime: 30_000,
  component: MonitorsPage,
  pendingComponent: Loading,
});
