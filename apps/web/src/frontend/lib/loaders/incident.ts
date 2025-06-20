import { supabase } from "@/frontend/lib/supabase";
import { Incident } from "@/frontend/lib/types";

interface LoadIncidentParams {
  params: { id: string };
  abortController: AbortController;
}

export default async function loadIncident({
  params,
  abortController,
}: LoadIncidentParams): Promise<Incident> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`/api/incidents/${params.id}`, {
    signal: abortController.signal,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch incident");
  }

  const data = (await response.json()) as { data: Incident };
  return data.data;
}
