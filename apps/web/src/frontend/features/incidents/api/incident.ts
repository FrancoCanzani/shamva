import { Incident } from "@/frontend/lib/types";
import { RouterContext } from "@/frontend/routes/__root";

interface LoadIncidentParams {
  params: { id: string };
  context: RouterContext;
}

export default async function fetchIncident({
  params,
  context,
}: LoadIncidentParams): Promise<Incident> {
  const response = await fetch(`/api/v1/incidents/${params.id}`, {
    headers: {
      Authorization: `Bearer ${context.auth.session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch incident");
  }

  const data = (await response.json()) as { data: Incident };
  return data.data;
}
