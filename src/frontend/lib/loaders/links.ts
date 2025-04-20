import { redirect } from "@tanstack/react-router";
import { supabase } from "../supabase";
import { ApiLinksResponse } from "../types";

export async function fetchLinks({
  abortController,
}: {
  abortController: AbortController;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
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
    const response = await fetch("/api/links", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch links: ${response.statusText}`);
    }

    const data = (await response.json()) as ApiLinksResponse;
    return data.links;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return [];
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unknown error occurred");
  }
}
