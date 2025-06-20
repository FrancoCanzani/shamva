import { createFileRoute } from "@tanstack/react-router";
import loadIncident from "@/frontend/lib/loaders/incident";
import IncidentPage from "@/frontend/components/pages/incident-page";

export const Route = createFileRoute(
  "/dashboard/$workspaceName/incidents/$id/"
)({
  loader: ({ params, abortController }) =>
    loadIncident({ params, abortController }),
  component: IncidentPage,
});
