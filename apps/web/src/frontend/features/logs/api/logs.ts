import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse, Log, Workspace } from "@/frontend/types/types";
import { redirect } from "@tanstack/react-router";

export async function fetchLogs({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<Log[]> {
  const workspaceNameFromParams = params.workspaceName;

  try {
    const allWorkspaces =
      queryClient.getQueryData<Workspace[]>(["workspaces"]) ??
      (await queryClient.ensureQueryData<Workspace[]>({
        queryKey: ["workspaces"],
        queryFn: fetchWorkspaces,
      }));

    const targetWorkspace = allWorkspaces.find(
      (ws) => ws.name === workspaceNameFromParams
    );

    if (!targetWorkspace) {
      throw redirect({
        to: "/dashboard/workspaces/new",
        throw: true,
      });
    }

    const workspaceId = targetWorkspace.id;

    const logsResponse = await fetch(`/api/logs?workspaceId=${workspaceId}`, {
      headers: {
        Authorization: `Bearer ${context.auth.session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (logsResponse.status === 401) {
      console.log("API returned 401 fetching logs, redirecting to login.");
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/${workspaceNameFromParams}/logs` },
        throw: true,
      });
    }

    if (!logsResponse.ok) {
      throw new Error(`Failed to fetch logs (Status: ${logsResponse.status})`);
    }

    const logsResult: ApiResponse<Log[]> = await logsResponse.json();

    if (!logsResult.success || !logsResult.data) {
      throw new Error(logsResult.error || "Failed to fetch logs from API");
    }

    return logsResult.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }

    if (error instanceof Error) {
      throw new Error(`Failed to load logs data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching logs data.");
  }
}

export type LogsPage = {
  data: Log[];
  nextCursor: { createdAt: string; id: string } | null;
};

export async function fetchLogsPage({
  workspaceName,
  cursor,
  context,
  limit = 100,
}: {
  workspaceName: string;
  cursor?: { createdAt: string; id: string } | null;
  context: RouterContext;
  limit?: number;
}): Promise<LogsPage> {
  const allWorkspaces =
    queryClient.getQueryData<Workspace[]>(["workspaces"]) ??
    (await queryClient.ensureQueryData<Workspace[]>({
      queryKey: ["workspaces"],
      queryFn: fetchWorkspaces,
    }));

  const targetWorkspace = allWorkspaces.find((ws) => ws.name === workspaceName);

  if (!targetWorkspace) {
    throw redirect({
      to: "/dashboard/workspaces/new",
      throw: true,
    });
  }

  const params = new URLSearchParams({
    workspaceId: targetWorkspace.id,
    limit: String(limit),
  });
  if (cursor?.createdAt) params.set("cursorCreatedAt", cursor.createdAt);
  if (cursor?.id) params.set("cursorId", cursor.id);

  const res = await fetch(`/api/logs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${context.auth.session?.access_token}`,
    },
  });

  if (res.status === 401) {
    throw redirect({ to: "/auth/login", throw: true });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch logs page: ${res.status} ${text}`);
  }
  const json: ApiResponse<Log[]> & {
    nextCursor?: { createdAt: string; id: string } | null;
  } = await res.json();
  return {
    data: json.data || [],
    nextCursor: json.nextCursor ?? null,
  };
}
