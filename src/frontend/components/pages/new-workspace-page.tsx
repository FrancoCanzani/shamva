import { useAuth } from "@/frontend/lib/context/auth-context";
import {
  ApiResponse,
  Workspace,
  WorkspaceFormValues,
} from "@/frontend/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import WorkspaceForm from "../workspace-form";

export default function NewWorkspacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const handleSubmit = async (formData: WorkspaceFormValues) => {
    setIsSubmitting(true);

    try {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const workspaceRequest = {
        name: formData.name,
        description: formData.description,
        members: formData.members,
        creatorEmail: session.user.email,
      };

      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(workspaceRequest),
      });

      const result: ApiResponse<Workspace> = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to create workspace (${response.status})`,
        );
      }

      toast.success("Workspace created successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.invalidate();
      navigate({
        to: "/dashboard/workspaces",
      });
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate({
      to: "/dashboard/workspaces",
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-8">
        <div>
          <h1 className="font-medium text-xl">Create New Workspace</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Set up a new workspace for your team.
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
