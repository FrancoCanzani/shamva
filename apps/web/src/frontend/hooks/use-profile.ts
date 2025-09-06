import { fetchProfile } from "@/frontend/features/profiles/api/profile";
import { Profile } from "@/frontend/lib/types";
import { useQuery } from "@tanstack/react-query";

export function useProfile() {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: (failureCount, error) => {
      // Don't retry if the profile doesn't exist (404)
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    hasProfile: profile?.first_name != null && profile?.last_name != null,
  };
}
