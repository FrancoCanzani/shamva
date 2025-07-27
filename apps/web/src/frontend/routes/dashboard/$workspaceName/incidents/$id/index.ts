import fetchIncident from "@/frontend/features/incidents/api/incident";
import IncidentPage from "@/frontend/features/incidents/components/incident-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/incidents/$id/")({
  loader: ({ params, context }) =>
    fetchIncident({ params, context }),
  component: IncidentPage,
});
