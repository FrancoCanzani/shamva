import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiResponse, Monitor } from "../types";

export async function fetchMonitors({
  abortController,
}: {
  abortController: AbortController;
}): Promise<Monitor[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session Error fetching monitors:", sessionError);

    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/monitors" },
      throw: true,
    });
  }

  if (!session?.access_token) {
    console.log("No active session found, redirecting to login.");
    throw redirect({
      to: "/auth/login",
      search: { redirect: "/dashboard/monitors" },
      throw: true,
    });
  }

  const token = session.access_token;

  try {
    const response = await fetch("/api/monitors", {
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
        search: { redirect: "/dashboard/monitors" },
        throw: true,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch monitors: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(`Failed to fetch monitors (Status: ${response.status})`);
    }

    const result: ApiResponse<Monitor[]> = await response.json();

    if (!result.success || !result.data) {
      console.error(
        "API Error fetching monitors:",
        result.error,
        result.details,
      );
      throw new Error(result.error || "Failed to fetch monitors from API");
    }

    return result.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("Monitors fetch aborted.");
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

    console.error("Error fetching monitors:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to load monitors data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching monitors data.");
  }
}
