import { Route } from "@/frontend/routes/dashboard/workspaces/$workspaceId";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import {
  ApiResponse,
  Workspace,
  WorkspaceFormValues,
} from "@/frontend/types/types";
import WorkspaceForm from "./workspace-form";

export default function EditWorkspacePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { invalidateWorkspaces } = useWorkspaces();
  const router = useRouter();
  const workspace: Workspace = Route.useLoaderData();

  const initialValues: WorkspaceFormValues = {
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

  const handleDelete = async () => {
    const response = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete workspace");
    }

    invalidateWorkspaces();
    router.invalidate();
    navigate({ to: "/dashboard/workspaces" });
  };

  const updateWorkspaceMutation = useMutation<
    ApiResponse<Workspace>,
    Error,
    WorkspaceFormValues
  >({
    mutationFn: async (formData) => {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const formDataWithCreatorEmail = {
        ...formData,
        creatorEmail: session.user.email,
      };

      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formDataWithCreatorEmail),
      });

      const result: ApiResponse<Workspace> = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to update workspace (${response.status})`
        );
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Workspace updated successfully");
      invalidateWorkspaces();
      router.invalidate();
      navigate({ to: "/dashboard/workspaces" });
    },
    onError: (error) => {
      console.error("Error updating workspace:", error);
      toast.error(
        error.message || "An unexpected error occurred during update"
      );
    },
  });

  const handleSubmit = async (formData: WorkspaceFormValues) => {
    updateWorkspaceMutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate({
      to: "/dashboard/workspaces",
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-medium">Edit Workspace</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Update the details and manage members for your workspace.
          </p>
        </div>

        <WorkspaceForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={handleDelete}
          isSubmitting={updateWorkspaceMutation.isPending}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
