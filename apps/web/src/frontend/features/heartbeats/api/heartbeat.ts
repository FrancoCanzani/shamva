import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse, Heartbeat } from "@/frontend/lib/types";
import { redirect } from "@tanstack/react-router";

export default async function fetchHeartbeat({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<Heartbeat> {
  const { id } = params;

  try {
    const response = await fetch(`/api/heartbeats/${id}`, {
      headers: {
        Authorization: `Bearer ${context.auth.session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      console.log("API returned 401, redirecting to login.");
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/heartbeats/${id}` },
        throw: true,
      });
    }

    if (response.status === 404) {
      throw new Error(`Heartbeat with ID ${id} not found.`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch heartbeat ${id}: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(`Failed to fetch heartbeat (Status: ${response.status})`);
    }

    const result: ApiResponse<Heartbeat> = await response.json();
    if (!result.success || !result.data) {
      console.error(
        `API Error fetching heartbeat ${id}:`,
        result.error,
        result.details
      );
      throw new Error(result.error || `Failed to fetch heartbeat ${id}`);
    }

    return result.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 302
    ) {
      throw error;
    }
    console.error(`Error fetching heartbeat ${id}:`, error);
    throw error;
  }
}
