import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { ApiResponse, Monitor } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/new";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import MonitorForm, { MonitorFormValues } from "../monitor/monitor-form";

export default function NewMonitorPage() {
  const navigate = useNavigate();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const { workspaceName } = Route.useParams();
  const { currentWorkspace } = useWorkspaces();

  const handleSubmit = async (formData: MonitorFormValues) => {
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

      let parsedHeaders: Record<string, string> | undefined = undefined;
      if (formData.headersString) {
        try {
          parsedHeaders = JSON.parse(formData.headersString);
          if (
            typeof parsedHeaders !== "object" ||
            Array.isArray(parsedHeaders) ||
            parsedHeaders === null
          ) {
            throw new Error("Headers must be a JSON object.");
          }
        } catch {
          throw new Error("Invalid JSON format for headers.");
        }
      }

      let parsedBody: Record<string, unknown> | string | undefined = undefined;
      if (formData.method === "POST" && formData.bodyString) {
        try {
          parsedBody = JSON.parse(formData.bodyString);
        } catch {
          throw new Error("Invalid JSON format for body.");
        }
      }

      const monitorRequest = {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        interval: formData.interval,
        regions: formData.regions,
        headers: parsedHeaders,
        body: parsedBody,
        workspaceId: currentWorkspace.id,
      };

      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(monitorRequest),
      });

      const result: ApiResponse<Monitor> = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to create monitor (${response.status})`
        );
      }

      toast.success("Monitor created successfully");
      router.invalidate();
      navigate({
        to: "/dashboard/$workspaceName/monitors",
        params: { workspaceName: workspaceName },
      });
    } catch (error) {
      console.error("Error creating monitor:", error);
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
      to: "/dashboard/$workspaceName/monitors",
      params: { workspaceName: workspaceName },
    });
  };

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="space-y-8">
        <div>
          <h1 className="font-medium text-xl">Create New Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter the details for the URL you want to monitor.
          </p>
        </div>

        <MonitorForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel="Create Monitor"
        />
      </div>
    </div>
  );
}
