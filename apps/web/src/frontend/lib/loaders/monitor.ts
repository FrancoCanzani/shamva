import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiResponse, Monitor } from "../types";

export default async function fetchMonitor({
  params,
  abortController,
  days,
}: {
  params: Params;
  abortController: AbortController;
  days: number;
}) {
  const { id } = params;

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) {
    throw redirect({
      to: "/auth/login",
      search: { redirect: `/dashboard/monitors/${id}` },
      throw: true,
    });
  }
  try {
    // For 1-day stats, we fetch 2 days of logs to enable 24h progression comparison in the UI
    const fetchDays = days === 1 ? 2 : days;
    const response = await fetch(`/api/monitors/${id}?days=${fetchDays}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: abortController?.signal,
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

    const result: ApiResponse<Monitor> = await response.json();
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
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log(`Monitor fetch (${id}) aborted.`);
      throw error;
    }
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
