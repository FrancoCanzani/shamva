import supabase from "@/frontend/lib/supabase";
import { ApiResponse, Workspace } from "@/frontend/lib/types";

export default async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    throw new Error("Failed to get authentication claims");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error("Failed to get access token");
  }

  const response = await fetch("/api/workspaces", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  const data: ApiResponse<Workspace[]> = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch workspaces");
  }

  return data.data ?? [];
}
