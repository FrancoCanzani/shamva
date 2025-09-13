import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { ApiResponse, Monitor, MonitorFormData } from "@/frontend/lib/types";
import { Route } from "@/frontend/routes/dashboard/$workspaceSlug/monitors/$id/edit";
import {
  useNavigate,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import HttpMonitorForm from "./monitor/forms/http-monitor-form";
import TcpMonitorForm from "./monitor/forms/tcp-monitor-form";

export default function EditMonitorPage() {
  const navigate = useNavigate();
  const router = useRouter();

  const { id, workspaceSlug } = Route.useParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const monitor = Route.useLoaderData();

  const { auth } = useRouteContext({
    from: "/dashboard/$workspaceSlug/monitors/$id/edit/",
  });
  const { currentWorkspace } = useWorkspaces(workspaceSlug);

  const handleSubmit = async (formData: MonitorFormData) => {
    setIsSubmitting(true);
    try {
      if (!auth.session?.access_token) {
        throw new Error("Authentication error. Please log in again.");
      }

      const monitorRequest = {
        ...formData,
        workspaceId: currentWorkspace && currentWorkspace.id,
      };

      const response = await fetch(`/api/v1/monitors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.session.access_token}`,
        },
        body: JSON.stringify(monitorRequest),
      });

      const result: ApiResponse<Monitor> = await response.json();

      if (!response.ok) {
        console.error("Error response from API:", result);
        throw new Error(
          result.error || `Failed to update monitor (${response.status})`
        );
      }

      toast.success("Monitor updated successfully");
      router.invalidate();
      navigate({
        to: "/dashboard/$workspaceSlug/monitors",
        params: { workspaceSlug: workspaceSlug },
      });
    } catch (error) {
      console.error("Error updating monitor:", error);
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
      to: "/dashboard/$workspaceSlug/monitors",
      params: { workspaceSlug: workspaceSlug },
    });
  };

  if (monitor.check_type === "http") {
    const initialValues = {
      name: monitor.name,
      url: monitor.url || "",
      method: monitor.method as "GET" | "POST" | "HEAD",
      interval: monitor.interval,
      regions: monitor.regions,
      headers: monitor.headers,
      body: monitor.body || undefined,
      degradedThresholdMs: monitor.degraded_threshold_ms || undefined,
      timeoutThresholdMs: monitor.timeout_threshold_ms || undefined,
    };

    return (
      <div className="container mx-auto max-w-5xl p-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-medium">Edit HTTP Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Update the details for your HTTP monitor.
            </p>
          </div>

          <HttpMonitorForm
            defaultValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitLabel="Update Monitor"
          />
        </div>
      </div>
    );
  } else if (monitor.check_type === "tcp") {
    const initialValues = {
      name: monitor.name,
      tcpHostPort: monitor.tcp_host_port || "",
      interval: monitor.interval,
      regions: monitor.regions,
      degradedThresholdMs: monitor.degraded_threshold_ms || undefined,
      timeoutThresholdMs: monitor.timeout_threshold_ms || undefined,
    };

    return (
      <div className="container mx-auto max-w-5xl p-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-medium">Edit TCP Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Update the details for your TCP monitor.
            </p>
          </div>

          <TcpMonitorForm
            defaultValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitLabel="Update Monitor"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-medium">Edit Monitor</h1>
          <p className="text-muted-foreground mt-1">Unknown monitor type.</p>
        </div>
      </div>
    </div>
  );
}
