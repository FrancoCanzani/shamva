import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";

export async function fetchLogs({
  abortController,
}: {
  abortController: AbortController;
}) {
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
      console.error("Failed to fetch analytics");
      throw new Error(`Failed to fetch analytics`);
    }

    const data = await response.json();
    return data ?? [];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("Analytics fetch aborted.");
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

    console.error("Error fetching analytics:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to load analytics data: ${error.message}`);
    }

    throw new Error("An unknown error occurred while fetching analytics data.");
  }
}
