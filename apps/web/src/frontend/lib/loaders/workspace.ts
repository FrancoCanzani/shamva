import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiResponse, Workspace } from "../types";

export default async function fetchWorkspace({
  params,
  abortController,
}: {
  params: Params;
  abortController: AbortController;
}): Promise<Workspace> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session Error fetching monitors:", sessionError);
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/monitors" },
      throw: true,
    });
  }

  if (!session?.access_token) {
    console.log("No active session found, redirecting to login.");
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/monitors" },
      throw: true,
    });
  }

  const response = await fetch(`/api/workspaces/${params.workspaceId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    signal: abortController?.signal,
  });

  if (!response.ok) {
    const err: ApiResponse<null> = await response.json();
    console.error(`API Error fetching workspace ${params.workspaceId}:`, err);
    if (response.status === 404) {
      throw new Error("Workspace not found or access denied");
    }
    throw new Error(
      err.error || `Failed to fetch workspace (${response.status})`
    );
  }

  const result: ApiResponse<Workspace> = await response.json();

  if (!result.success || !result.data) {
    console.error("API Result indicates failure or no data:", result);
    throw new Error(
      result.error || "Failed to fetch workspace: API reported failure"
    );
  }

  return result.data;
}
