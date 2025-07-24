import { supabase } from "@/frontend/lib/supabase";
import { ApiResponse, Heartbeat, Workspace } from "@/frontend/types/types";
import { redirect } from "@tanstack/react-router";

export async function fetchHeartbeats({
  params,
  abortController,
}: {
  params: Params;
  abortController: AbortController;
}): Promise<Heartbeat[]> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) {
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/heartbeats" },
      throw: true,
    });
  }
  const workspaceName = params.workspaceName;
  if (!workspaceName) {
    throw redirect({
      to: "/dashboard/workspaces/new",
      throw: true,
    });
  }
  try {
    const workspaceResponse = await fetch("/api/workspaces", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: abortController?.signal,
    });

    if (workspaceResponse.status === 401) {
      console.log(
        "API returned 401 fetching workspaces, redirecting to login."
      );
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/${workspaceName}/heartbeats` },
        throw: true,
      });
    }

    if (!workspaceResponse.ok) {
      const errorText = await workspaceResponse.text();
      console.error(
        `Failed to fetch workspaces: ${workspaceResponse.status} ${workspaceResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch workspaces (Status: ${workspaceResponse.status})`
      );
    }

    const workspaceResult: ApiResponse<Workspace[]> =
      await workspaceResponse.json();

    if (!workspaceResult.success || !workspaceResult.data) {
      console.error(
        "API Error fetching workspaces:",
        workspaceResult.error,
        workspaceResult.details
      );
      throw new Error(
        workspaceResult.error || "Failed to fetch workspaces from API"
      );
    }

    const allWorkspaces = workspaceResult.data;
    const targetWorkspace = allWorkspaces.find(
      (ws) => ws.name === workspaceName
    );

    if (!targetWorkspace) {
      console.warn(
        `Workspace with name "${workspaceName}" not found, redirecting.`
      );
      throw redirect({
        to: "/dashboard/workspaces/new",
        throw: true,
      });
    }

    const workspaceId = targetWorkspace.id;

    const heartbeatsResponse = await fetch(
      `/api/heartbeats?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: abortController?.signal,
      }
    );

    if (heartbeatsResponse.status === 401) {
      console.log(
        "API returned 401 fetching heartbeats, redirecting to login."
      );
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/${workspaceName}/heartbeats` },
        throw: true,
      });
    }

    if (!heartbeatsResponse.ok) {
      const errorText = await heartbeatsResponse.text();
      console.error(
        `Failed to fetch heartbeats: ${heartbeatsResponse.status} ${heartbeatsResponse.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch heartbeats (Status: ${heartbeatsResponse.status})`
      );
    }

    const heartbeatsResult: ApiResponse<Heartbeat[]> =
      await heartbeatsResponse.json();

    if (!heartbeatsResult.success || !heartbeatsResult.data) {
      console.error(
        "API Error fetching heartbeats:",
        heartbeatsResult.error,
        heartbeatsResult.details
      );
      throw new Error(
        heartbeatsResult.error || "Failed to fetch heartbeats from API"
      );
    }

    return heartbeatsResult.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("Fetch aborted.");
      return [];
    }
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    console.error("Error in fetchHeartbeats loader:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load heartbeats data: ${error.message}`);
    }
    throw new Error(
      "An unknown error occurred while fetching heartbeats data."
    );
  }
}
