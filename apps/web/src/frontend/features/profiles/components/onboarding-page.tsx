import { useCreateWorkspace } from "@/frontend/features/workspaces/api/mutations";
import WorkspaceForm from "@/frontend/features/workspaces/components/workspace-form";
import { useProfile } from "@/frontend/hooks/use-profile";
import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { ProfileFormValues, WorkspaceFormValues } from "@/frontend/lib/types";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useUpdateProfile } from "../api/mutations";
import ProfileForm from "./profile-form";
type OnboardingStep = "profile" | "workspace";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile");

  const { profile } = useProfile();
  const { invalidateWorkspaces } = useWorkspaces();
  const updateProfileMutation = useUpdateProfile();
  const createWorkspaceMutation = useCreateWorkspace();

  const handleProfileSubmit = async (formData: ProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync(formData);
      setCurrentStep("workspace");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleWorkspaceSubmit = async (formData: WorkspaceFormValues) => {
    try {
      await createWorkspaceMutation.mutateAsync(formData);
      invalidateWorkspaces();

      navigate({
        to: "/dashboard/$workspaceSlug/monitors",
        params: { workspaceSlug: formData.slug },
      });
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const handleSkipProfile = () => {
    setCurrentStep("workspace");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-medium">Let's get you set up</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            This will only take a minute
          </p>
        </div>

        <div>
          {currentStep === "profile" && (
            <div className="space-y-6">
              <ProfileForm
                initialValues={{
                  first_name: profile?.first_name || "",
                  last_name: profile?.last_name || "",
                }}
                onSubmit={handleProfileSubmit}
                onCancel={handleSkipProfile}
                isSubmitting={updateProfileMutation.isPending}
                submitLabel="Continue"
              />
            </div>
          )}

          <div>
            {currentStep === "workspace" && (
              <WorkspaceForm
                onSubmit={handleWorkspaceSubmit}
                isSubmitting={createWorkspaceMutation.isPending}
                submitLabel="Create Workspace"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
