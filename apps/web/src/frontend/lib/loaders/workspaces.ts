import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiResponse, Workspace } from "../types";

export default async function fetchWorkspaces({
  abortController,
}: {
  abortController: AbortController;
}): Promise<Workspace[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session Error fetching workspaces:", sessionError);
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/workspaces" },
      throw: true,
    });
  }

  if (!session?.access_token) {
    console.log("No active session found, redirecting to login.");
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/workspaces" },
      throw: true,
    });
  }

  const token = session.access_token;
  const response = await fetch("/api/workspaces", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: abortController?.signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch workspaces");
  }

  const result: ApiResponse<Workspace[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch workspaces");
  }

  return result.data ?? [];
}
