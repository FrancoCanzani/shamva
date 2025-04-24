import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiResponse, Log } from "../types";

export async function fetchLogs({
  abortController,
}: {
  abortController: AbortController;
}): Promise<Log[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session Error:", sessionError);
    throw new Error("Failed to get authentication session");
  }

  if (!session?.access_token) {
    throw redirect({
      to: "/auth/login",
      throw: true,
    });
  }

  const token = session.access_token;

  try {
    const response = await fetch("/api/logs", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: abortController?.signal,
    });

    if (response.status === 401) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: "/dashboard/analytics" },
        throw: true,
      });
    }

    if (!response.ok) {
      console.error("Failed to fetch logs");
      throw new Error(`Failed to fetch logs`);
    }

    const result: ApiResponse<Log[]> = await response.json();

    if (!result.success || !result.data) {
      console.error("API Error:", result.error, result.details);
      throw new Error(result.error || "Failed to fetch logs");
    }

    return result.data || [];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("Logs fetch aborted.");
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

    console.error("Error fetching logs:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to load logs data: ${error.message}`);
    }

    throw new Error("An unknown error occurred while fetching logs data.");
  }
}
