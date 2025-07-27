import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse, Workspace } from "@/frontend/types/types";

export default async function fetchWorkspace({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<Workspace[]> {
  const response = await fetch(`/api/workspaces/${params.workspaceId}`, {
    headers: {
      Authorization: `Bearer ${context.auth.session?.access_token}`,
    },
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
