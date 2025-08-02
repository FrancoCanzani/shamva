import supabase from "@/frontend/lib/supabase";
import { ApiResponse, Workspace } from "@/frontend/types/types";
import { redirect } from "@tanstack/react-router";

export default async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) {
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/workspaces" },
      throw: true,
    });
  }

  try {
    const response = await fetch("/api/workspaces", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw redirect({
          to: "/auth/login",
          search: { redirect: "/dashboard/workspaces" },
          throw: true,
        });
      }
      throw new Error("Failed to fetch workspaces");
    }

    const result: ApiResponse<Workspace[]> = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch workspaces");
    }

    return result.data ?? [];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      console.error("Error fetching workspaces:", error);
      throw new Error("Failed to fetch workspaces");
    }
    throw error;
  }
}
