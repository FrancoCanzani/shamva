import Loading from "@/frontend/components/loading";
import { fetchCollector } from "@/frontend/features/collectors/api/collector";
import CollectorPage from "@/frontend/features/collectors/components/collector-page";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const CollectorSearchSchema = z.object({
  days: z.number().int().min(1).max(28).default(7),
});

export const Route = createFileRoute("/dashboard/$workspaceName/collectors/$id/")({
  component: CollectorPage,
  pendingComponent: Loading,
  validateSearch: (search) => CollectorSearchSchema.parse(search),
  loaderDeps: ({ search: { days } }) => ({ days }),
  loader: ({ params, context, deps: { days } }) =>
    fetchCollector({ params, context, days }),
});
