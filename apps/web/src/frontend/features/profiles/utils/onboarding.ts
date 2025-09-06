import { Profile, Workspace } from "../../../lib/types";

export interface OnboardingStatus {
  needsOnboarding: boolean;
  hasProfile: boolean;
  hasWorkspace: boolean;
  redirectTo: string;
}

export function checkOnboardingStatus(
  profile: Profile | null | undefined,
  workspaces: Workspace[] | null | undefined,
  isProfileLoading: boolean,
  isWorkspacesLoading: boolean
): OnboardingStatus {
  // If data is still loading, don't redirect yet
  if (isProfileLoading || isWorkspacesLoading) {
    return {
      needsOnboarding: false,
      hasProfile: false,
      hasWorkspace: false,
      redirectTo: "/dashboard",
    };
  }

  const hasProfile =
    profile?.first_name != null &&
    profile?.last_name != null &&
    profile.first_name.trim() !== "" &&
    profile.last_name.trim() !== "";
  const hasWorkspace = workspaces != null && workspaces.length > 0;

  // User needs onboarding if they don't have a profile OR don't have a workspace
  const needsOnboarding = !hasProfile || !hasWorkspace;

  let redirectTo = "/dashboard";

  if (needsOnboarding) {
    redirectTo = "/dashboard/onboarding";
  } else if (hasWorkspace && workspaces && workspaces.length > 0) {
    // Redirect to the first workspace if they have completed onboarding
    redirectTo = `/dashboard/${workspaces[0].slug}/monitors`;
  }

  return {
    needsOnboarding,
    hasProfile,
    hasWorkspace,
    redirectTo,
  };
}

export function shouldRedirectToOnboarding(
  profile: Profile | null | undefined,
  workspaces: Workspace[] | null | undefined,
  isProfileLoading: boolean,
  isWorkspacesLoading: boolean
): boolean {
  const status = checkOnboardingStatus(
    profile,
    workspaces,
    isProfileLoading,
    isWorkspacesLoading
  );
  return status.needsOnboarding;
}
