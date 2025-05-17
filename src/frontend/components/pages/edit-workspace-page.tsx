import { Route } from "@/frontend/routes/dashboard/workspaces/$workspaceId";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useAuth } from "@/frontend/lib/context/auth-context";
import {
  ApiResponse,
  MonitorWorkspaceFormValues,
  Workspace,
} from "@/frontend/lib/types";
import WorkspaceForm from "../workspace-form";

export default function EditWorkspacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const workspace: Workspace = Route.useLoaderData();

  const initialValues: MonitorWorkspaceFormValues = {
    name: workspace.name,
    description: workspace.description || "",
    members:
      workspace.workspace_members?.map((m) => ({
        id: m.id,
        email: m.invitation_email || "",
        role: m.role,
        invitation_status: m.invitation_status,
        user_id: m.user_id,
      })) || [],
  };

  const updateWorkspaceMutation = useMutation<
    ApiResponse<Workspace>,
    Error,
    MonitorWorkspaceFormValues
  >({
    mutationFn: async (formData) => {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const response = await fetch(`/api/workspace/${workspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse<Workspace> = await response.json();

      console.log(result);

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to update workspace (${response.status})`,
        );
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Workspace updated successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id] });
      navigate({ to: "/dashboard/workspaces" });
    },
    onError: (error) => {
      console.error("Error updating workspace:", error);
      toast.error(
        error.message || "An unexpected error occurred during update",
      );
    },
  });

  const handleSubmit = async (formData: MonitorWorkspaceFormValues) => {
    updateWorkspaceMutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate({
      to: "/dashboard/workspaces",
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-medium">Edit Workspace</h1>
          <p className="text-muted-foreground mt-1">
            Update the details and manage members for your workspace.
          </p>
        </div>

        <WorkspaceForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateWorkspaceMutation.isPending}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
