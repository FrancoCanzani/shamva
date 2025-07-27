import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse, StatusPage } from "@/frontend/types/types";
import { redirect } from "@tanstack/react-router";

export default async function fetchStatusPage({
  params,
  context,
}: {
  params: Params;
  context: RouterContext;
}): Promise<StatusPage> {
  const { id } = params;

  try {
    const response = await fetch(`/api/status-pages/${id}`, {
      headers: {
        Authorization: `Bearer ${context.auth.session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      console.log("API returned 401, redirecting to login.");
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/status-pages/${id}` },
        throw: true,
      });
    }

    if (response.status === 404) {
      throw new Error(`Status page with ID ${id} not found.`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch status page ${id}: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch status page (Status: ${response.status})`
      );
    }

    const result: ApiResponse<StatusPage> = await response.json();

    if (!result.success || !result.data) {
      console.error(
        `API Error fetching status page ${id}:`,
        result.error,
        result.details
      );
      throw new Error(result.error || `Failed to fetch status page ${id}`);
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
    console.error(`Error fetching status page ${id}:`, error);
    throw error;
  }
}
