import { useAuth } from "@/frontend/lib/context/auth-context";
import { ApiResponse, Workspace } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import WorkspaceForm, { MonitorWorkspaceFormValues } from "../workspace-form";

export default function NewWorkspacePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const { workspaceName } = Route.useParams();

  const handleSubmit = async (formData: MonitorWorkspaceFormValues) => {
    setIsSubmitting(true);
    try {
      if (!session?.access_token) {
        toast.error("Authentication error. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse<Workspace> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create workspace");
      }

      toast.success(`Workspace "${formData.name}" created successfully!`);

      if (result && result.data && result.data.name) {
        navigate({
          to: "/dashboard/$workspaceName/monitors",
          params: { workspaceName: result.data.name },
        });
      } else {
        navigate({
          to: "/dashboard/$workspaceName/monitors",
          params: { workspaceName: workspaceName },
        });
      }
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
    navigate({
      to: "/dashboard/$workspaceName/monitors",
      params: { workspaceName: workspaceName },
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-medium">Create New Workspace</h1>
          <p className="text-muted-foreground mt-1">
            Create a workspace to organize your monitors and collaborate with
            team members.
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
