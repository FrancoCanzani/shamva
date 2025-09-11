import { Workspace } from "../../../lib/types";

export interface OnboardingStatus {
  needsOnboarding: boolean;
  hasWorkspace: boolean;
  redirectTo: string;
}

export function checkOnboardingStatus(
  workspaces: Workspace[] | null | undefined,
  isWorkspacesLoading: boolean
): OnboardingStatus {
  // If data is still loading, don't redirect yet
  if (isWorkspacesLoading) {
    return {
      needsOnboarding: false,
      hasWorkspace: false,
      redirectTo: "/dashboard",
    };
  }

  const hasWorkspace = workspaces != null && workspaces.length > 0;

  // User needs onboarding if they don't have a workspace
  const needsOnboarding = !hasWorkspace;

  let redirectTo = "/dashboard";

  if (needsOnboarding) {
    redirectTo = "/dashboard/onboarding";
  } else if (hasWorkspace && workspaces && workspaces.length > 0) {
    // Redirect to the first workspace if they have completed onboarding
    redirectTo = `/dashboard/${workspaces[0].slug}/monitors`;
  }

  return {
    needsOnboarding,
    hasWorkspace,
    redirectTo,
  };
}

export function shouldRedirectToOnboarding(
  workspaces: Workspace[] | null | undefined,
  isWorkspacesLoading: boolean
): boolean {
  const status = checkOnboardingStatus(workspaces, isWorkspacesLoading);
  return status.needsOnboarding;
}
