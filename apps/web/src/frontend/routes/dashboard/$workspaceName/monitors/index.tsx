import Loading from "@/frontend/components/loading";
import { fetchMonitors } from "@/frontend/features/monitors/api/monitors";
import MonitorsPage from "@/frontend/features/monitors/components/monitors-page";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const MonitorsSearchSchema = z.object({
  search: z.string().optional().default(""),
  status: z.string().optional().default(""),
  check_type: z.string().optional().default(""),
  sort: z.string().optional().default(""),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
});

export type MonitorsSearch = z.infer<typeof MonitorsSearchSchema>;

export const Route = createFileRoute("/dashboard/$workspaceName/monitors/")({
  validateSearch: (search) => MonitorsSearchSchema.parse(search),
  loader: ({ params, abortController }) =>
    fetchMonitors({ params, abortController }),
  staleTime: 30_000,
  component: MonitorsPage,
  pendingComponent: Loading,
});
