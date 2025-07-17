import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiResponse, StatusPage, Workspace } from "../types";

export async function fetchStatusPages({
  params,
  abortController,
}: {
  params: Params;
  abortController: AbortController;
}): Promise<StatusPage[]> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) {
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/status" },
      throw: true,
    });
  }

  const workspaceName = params.workspaceName;
  if (!workspaceName) {
    console.warn("Workspace name missing from route parameters, redirecting.");
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
        search: { redirect: `/dashboard/${workspaceName}/status` },
        throw: true,
      });
    }

    if (!workspaceResponse.ok) {
      throw new Error(
        `Failed to fetch workspaces (Status: ${workspaceResponse.status})`
      );
    }

    const workspaceResult: ApiResponse<Workspace[]> =
      await workspaceResponse.json();

    if (!workspaceResult.success || !workspaceResult.data) {
      throw new Error(
        workspaceResult.error || "Failed to fetch workspaces from API"
      );
    }

    const targetWorkspace = workspaceResult.data.find(
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

    const statusPagesResponse = await fetch(
      `/api/status-pages?workspaceId=${targetWorkspace.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: abortController?.signal,
      }
    );

    if (!statusPagesResponse.ok) {
      throw new Error(
        `Failed to fetch status pages (Status: ${statusPagesResponse.status})`
      );
    }

    const statusPagesResult: ApiResponse<StatusPage[]> =
      await statusPagesResponse.json();

    if (!statusPagesResult.success || !statusPagesResult.data) {
      throw new Error(
        statusPagesResult.error || "Failed to fetch status pages from API"
      );
    }

    return statusPagesResult.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("Status pages fetch aborted.");
      return [];
    }

    console.error("Error in fetchStatusPages loader:", error);
    throw error;
  }
}
