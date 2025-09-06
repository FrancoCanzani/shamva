import { fetchProfile } from "@/frontend/features/profiles/api/profile";
import OnboardingPage from "@/frontend/features/profiles/components/onboarding-page";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/onboarding/")({
  component: OnboardingPage,
  loader: async () => {
    try {
      const [workspacesData, profileData] = await Promise.allSettled([
        queryClient.ensureQueryData({
          queryKey: ["workspaces"],
          queryFn: fetchWorkspaces,
        }),
        queryClient.ensureQueryData({
          queryKey: ["profile"],
          queryFn: fetchProfile,
        }),
      ]);

      const workspaces =
        workspacesData.status === "fulfilled" ? workspacesData.value : [];
      const profile =
        profileData.status === "fulfilled" ? profileData.value : null;

      return { workspaces, profile };
    } catch (error) {
      console.error("Error loading onboarding data:", error);
      return { workspaces: [], profile: null };
    }
  },
});
