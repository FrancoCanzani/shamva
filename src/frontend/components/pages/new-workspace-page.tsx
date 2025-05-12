import { useAuth } from "@/frontend/lib/context/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import WorkspaceForm, { MonitorWorkspaceFormValues } from "../workspace-form";

export default function NewWorkspacePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const handleSubmit = async (formData: MonitorWorkspaceFormValues) => {
    setIsSubmitting(true);
    try {
      if (!session?.access_token) {
        toast.error("Authentication error. Please log in again.");
        // Potentially redirect to login
        // navigate({ to: "/auth/login", search: { redirect: "/dashboard/workspaces/new" } });
        setIsSubmitting(false);
        return;
      }

      // This is where you'd make the API call
      // For now, we'll simulate it
      console.log("Creating workspace with data:", formData);

      // Simulated API call
      // const response = await fetch("/api/workspaces", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${session.access_token}`,
      //   },
      //   body: JSON.stringify(formData),
      // });
      // const result: ApiResponse<Workspace> = await response.json();
      // if (!response.ok || !result.success) {
      //   throw new Error(result.error || "Failed to create workspace");
      // }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

      toast.success(
        `Workspace "${formData.workspaceName}" created successfully!`,
      );
      // Redirect to the new workspace or a list of workspaces
      navigate({ to: "/dashboard/monitors" }); // Or perhaps /dashboard/workspaces/:workspaceId
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/dashboard/monitors" });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-medium">Create New Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Enter the details for the URL you want to monitor.
          </p>
        </div>

        <WorkspaceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel="Create Workspace"
        />
      </div>
    </div>
  );
}
