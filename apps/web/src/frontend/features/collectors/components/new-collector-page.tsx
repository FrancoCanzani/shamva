import DashboardHeader from "@/frontend/components/dashboard-header";
import { useWorkspaces } from "@/frontend/lib/context/workspace-context";
import { CollectorFormValues } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/collectors/new";
import { useNavigate } from "@tanstack/react-router";
import { useCreateCollector } from "../api/mutations";
import CollectorForm from "./collector-form";
import CollectorSetupInstructions from "./collector-setup-instructions";

export default function NewCollectorPage() {
  const { workspaceName } = Route.useParams();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaces();
  const createCollector = useCreateCollector();

  const handleSubmit = async (values: CollectorFormValues) => {
    if (!currentWorkspace) {
      throw new Error("Workspace not found");
    }

    await createCollector.mutateAsync({
      workspaceId: currentWorkspace?.id,
      collectorData: values,
    });
    navigate({ to: `/dashboard/${workspaceName}/collectors` });
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader
        title={`Dashboard / ${workspaceName} / Collectors / New`}
      />
      <main className="container mx-auto max-w-4xl p-4">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-medium">Create a new Collector</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure an agent to collect server data.
            </p>
          </div>
          <CollectorForm
            onSubmit={handleSubmit}
            onCancel={() =>
              navigate({ to: `/dashboard/${workspaceName}/collectors` })
            }
            isSubmitting={createCollector.isPending}
          />
          <CollectorSetupInstructions />
        </div>
      </main>
    </div>
  );
}
