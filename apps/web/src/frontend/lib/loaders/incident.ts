import { supabase } from "@/frontend/lib/supabase";
import { Incident } from "@/frontend/lib/types";

interface LoadIncidentParams {
  params: { id: string };
  abortController: AbortController;
}

export default async function fetchIncident({
  params,
  abortController,
}: LoadIncidentParams): Promise<Incident> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`/api/incidents/${params.id}`, {
    signal: abortController.signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch incident");
  }

  const data = (await response.json()) as { data: Incident };
  return data.data;
}
