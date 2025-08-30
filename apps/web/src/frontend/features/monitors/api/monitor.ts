import { RouterContext } from "@/frontend/routes/__root";
import { ApiResponse } from "@/frontend/lib/types";
import { redirect } from "@tanstack/react-router";
import { MonitorWithIncidents } from "../types";

export default async function fetchMonitor({
  params,
  context,
  days,
  region,
}: {
  params: Params;
  context: RouterContext;
  days: number;
  region?: string;
}) {
  const { id } = params;

  try {
    // Fetch double the days to enable comparison with previous period
    const fetchDays =
      days === 1 ? 2 : days === 7 ? 14 : days === 14 ? 28 : days;
    const url = new URL(`/api/v1/monitors/${id}`, window.location.origin);
    url.searchParams.set("days", fetchDays.toString());
    if (region) {
      url.searchParams.set("region", region);
    }
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${context.auth.session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      console.log("API returned 401, redirecting to login.");
      throw redirect({
        to: "/auth/login",
        search: { redirect: `/dashboard/monitors/${id}` },
        throw: true,
      });
    }

    if (response.status === 404) {
      throw new Error(`Monitor with ID ${id} not found.`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch monitor ${id}: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(`Failed to fetch monitor (Status: ${response.status})`);
    }

    const result: ApiResponse<MonitorWithIncidents> = await response.json();

    if (!result.success || !result.data) {
      console.error(
        `API Error fetching monitor ${id}:`,
        result.error,
        result.details
      );
      throw new Error(result.error || `Failed to fetch monitor ${id}`);
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
    console.error(`Error fetching monitor ${id}:`, error);
    throw error;
  }
}
