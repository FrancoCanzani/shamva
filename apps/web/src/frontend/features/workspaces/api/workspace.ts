import { supabase } from "@/frontend/lib/supabase";
import { ApiResponse, Workspace } from "@/frontend/types/types";
import { redirect } from "@tanstack/react-router";

export default async function fetchWorkspace({
  params,
  abortController,
}: {
  params: Params;
  abortController: AbortController;
}): Promise<Workspace[]> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) {
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/monitors" },
      throw: true,
    });
  }

  const response = await fetch(`/api/workspaces/${params.workspaceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: abortController?.signal,
  });

  if (!response.ok) {
    const err: ApiResponse<null> = await response.json();
    if (response.status === 404) {
      throw new Error("Workspace not found or access denied");
    }
    throw new Error(
      err.error || `Failed to fetch workspace (${response.status})`
    );
  }

  const result: ApiResponse<Workspace[]> = await response.json();

  if (!result.success || !result.data) {
    console.error("API Result indicates failure or no data:", result);
    throw new Error(
      result.error || "Failed to fetch workspace: API reported failure"
    );
  }

  return result.data;
}
