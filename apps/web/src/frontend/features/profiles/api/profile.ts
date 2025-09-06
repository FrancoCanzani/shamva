import supabase from "@/frontend/lib/supabase";
import { Profile, ProfileFormValues } from "@/frontend/lib/types";

export async function fetchProfile(): Promise<Profile> {
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    throw new Error("Failed to get authentication claims");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error("Failed to get access token");
  }

  const response = await fetch("/api/v1/profiles", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

export async function updateProfile(data: ProfileFormValues): Promise<Profile> {
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    throw new Error("Failed to get authentication claims");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error("Failed to get access token");
  }

  const response = await fetch("/api/v1/profiles", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }

  return response.json();
}
