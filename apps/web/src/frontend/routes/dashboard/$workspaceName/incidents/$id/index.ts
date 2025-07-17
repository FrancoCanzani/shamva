import { createFileRoute } from "@tanstack/react-router";
import fetchIncident from "@/frontend/lib/loaders/incident";
import IncidentPage from "@/frontend/components/pages/incident-page";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/incidents/$id/"
)({
  loader: ({ params, abortController }) =>
    fetchIncident({ params, abortController }),
  component: IncidentPage,
});
