import { Route } from "@/frontend/routes/dashboard/workspaces/$workspaceId";
import { useNavigate, useRouter } from "@tanstack/react-router";

import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useRouteContext } from "@tanstack/react-router";
import {
  Workspace,
  WorkspaceFormValues,
} from "@/frontend/types/types";
import WorkspaceForm from "./workspace-form";
import { useUpdateWorkspace, useDeleteWorkspace } from "../api/mutations";

export default function EditWorkspacePage() {
  const navigate = useNavigate();
  const { auth } = useRouteContext({
    from: "/dashboard/workspaces/$workspaceId/",
  });
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

  const updateWorkspaceMutation = useUpdateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();

  const handleDelete = async () => {
    try {
      await deleteWorkspaceMutation.mutateAsync(workspace.id);
      invalidateWorkspaces();
      router.invalidate();
      navigate({ to: "/dashboard/workspaces" });
    } catch (error) {
      console.error("Failed to delete workspace:", error);
    }
  };

  const handleSubmit = async (formData: WorkspaceFormValues) => {
    try {
      const formDataWithCreatorEmail = {
        ...formData,
        creatorEmail: auth.session?.user?.email,
      };
      await updateWorkspaceMutation.mutateAsync({
        workspaceId: workspace.id,
        data: formDataWithCreatorEmail,
      });
      invalidateWorkspaces();
      router.invalidate();
      navigate({ to: "/dashboard/workspaces" });
    } catch (error) {
      console.error("Error updating workspace:", error);
    }
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
