import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { WorkspaceFormValues } from "@/frontend/lib/types";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCreateWorkspace } from "../api/mutations";
import WorkspaceForm from "./workspace-form";

export default function NewWorkspacePage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { invalidateWorkspaces } = useWorkspaces();

  const createWorkspaceMutation = useCreateWorkspace();

  const handleSubmit = async (formData: WorkspaceFormValues) => {
    try {
      await createWorkspaceMutation.mutateAsync(formData);
      invalidateWorkspaces();
      router.invalidate();
      navigate({
        to: "/dashboard/workspaces",
      });
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const handleCancel = () => {
    navigate({
      to: "/dashboard/workspaces",
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-medium">Create New Workspace</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Set up a new workspace for your team.
          </p>
        </div>

        <WorkspaceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createWorkspaceMutation.isPending}
          submitLabel="Create Workspace"
        />
      </div>
    </div>
  );
}
