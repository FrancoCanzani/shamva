import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import {
  ApiResponse,
  Monitor,
  StatusPage,
  StatusPageFormValues,
} from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/status-pages/new";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import StatusPageForm from "../status-page/status-page-form";

async function fetchMonitors(workspaceId: string, accessToken: string) {
  const response = await fetch(`/api/monitors?workspaceId=${workspaceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch monitors: ${response.status}`);
  }

  const result: ApiResponse<Monitor[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch monitors");
  }

  return result.data || [];
}

export default function NewStatusPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();
  const { workspaceName } = Route.useParams();
  const { currentWorkspace } = useWorkspaces();

  const { data: availableMonitors = [] } = useQuery({
    queryKey: ["monitors", currentWorkspace?.id],
    queryFn: () => fetchMonitors(currentWorkspace!.id, session!.access_token),
    enabled: !!(session?.access_token && currentWorkspace?.id),
  });

  const handleSubmit = async (formData: StatusPageFormValues) => {
    setIsSubmitting(true);

    try {
      if (!session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }

      if (!currentWorkspace?.id) {
        throw new Error(
          "No workspace selected. Please select a workspace first."
        );
      }

      const statusPageRequest = {
        ...formData,
        workspaceId: currentWorkspace.id,
      };

      const response = await fetch("/api/status-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(statusPageRequest),
      });

      const result: ApiResponse<StatusPage> = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to create status page (${response.status})`
        );
      }

      toast.success("Status page created successfully");
      navigate({
        to: "/dashboard/$workspaceName/status-pages",
        params: { workspaceName: workspaceName },
      });
    } catch (error) {
      console.error("Error creating status page:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate({
      to: "/dashboard/$workspaceName/status-pages",
      params: { workspaceName: workspaceName },
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-medium">Create New Status Page</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a public status page to share the health of your services
            with your users.
          </p>
        </div>

        <StatusPageForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel="Create Status Page"
          availableMonitors={availableMonitors}
        />
      </div>
    </div>
  );
}
