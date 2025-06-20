import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiResponse, Monitor } from "../types";

export default async function fetchMonitor({
  params,
  abortController,
}: {
  params: Params;
  abortController: AbortController;
}) {
  const { id } = params;
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    console.error("Session Error or no token:", sessionError);
    throw redirect({
      to: "/auth/login",
      search: { redirect: `/dashboard/monitors/${id}` },
      throw: true,
    });
  }

  const token = session.access_token;

  try {
    const response = await fetch(`/api/monitors/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
