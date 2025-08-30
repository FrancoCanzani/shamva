import {
  ApiResponse,
  Monitor,
  StatusPage,
  StatusPageFormValues,
} from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceSlug/status-pages/$id/edit";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import StatusPageForm from "./status-page/status-page-form";

async function fetchMonitors(workspaceId: string, accessToken: string) {
  const response = await fetch(`/api/v1/monitors?workspaceId=${workspaceId}`, {
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

export default function EditStatusPagePage() {
  const navigate = useNavigate();
  const { id, workspaceSlug } = Route.useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusPage = Route.useLoaderData();
  const { auth } = useRouteContext({
    from: "/dashboard/$workspaceSlug/status-pages/$id/edit/",
  });

  const { data: availableMonitors = [] } = useQuery({
    queryKey: ["monitors"],
    queryFn: () =>
      fetchMonitors(statusPage.workspace_id, auth.session!.access_token),
    enabled: !!(auth.session?.access_token && statusPage.workspace_id),
  });

  const handleSubmit = async (formData: StatusPageFormValues) => {
    setIsSubmitting(true);
    try {
      if (!auth.session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const statusPageRequest = {
        ...formData,
        workspaceId: statusPage.workspace_id,
      };

      const response = await fetch(`/api/v1/status-pages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.session.access_token}`,
        },
        body: JSON.stringify(statusPageRequest),
      });

      const result: ApiResponse<StatusPage> = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to update status page (${response.status})`
        );
      }

      toast.success("Status page updated successfully");
      navigate({
        to: "/dashboard/$workspaceSlug/status-pages",
        params: { workspaceSlug: workspaceSlug },
      });
    } catch (error) {
      console.error("Error updating status page:", error);
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
      to: "/dashboard/$workspaceSlug/status-pages",
      params: { workspaceSlug: workspaceSlug },
    });
  };

  const initialValues: StatusPageFormValues = {
    slug: statusPage.slug,
    title: statusPage.title,
    description: statusPage.description || "",
    showValues: statusPage.show_values,
    password: statusPage.password || "",
    isPublic: statusPage.is_public,
    monitors: statusPage.monitors,
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-medium">Edit Status Page</h1>
          <p className="text-muted-foreground mt-1">
            Update the details for your status page.
          </p>
        </div>

        <StatusPageForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel="Update Status Page"
          availableMonitors={availableMonitors}
        />
      </div>
    </div>
  );
}
