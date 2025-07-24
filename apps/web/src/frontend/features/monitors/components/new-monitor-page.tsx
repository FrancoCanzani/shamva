import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { Route } from "@/frontend/routes/dashboard/$workspaceName/monitors/new/$type";
import { ApiResponse, Monitor } from "@/frontend/types/types";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import HttpMonitorForm from "./monitor/forms/http-monitor-form";
import TcpMonitorForm from "./monitor/forms/tcp-monitor-form";

type HttpMonitorFormData = {
  name: string;
  checkType: "http";
  url: string;
  method: "GET" | "POST" | "HEAD";
  interval: number;
  regions: string[];
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
  slackWebhookUrl?: string;
};

type TcpMonitorFormData = {
  name: string;
  checkType: "tcp";
  tcpHostPort: string;
  interval: number;
  regions: string[];
  slackWebhookUrl?: string;
};

type MonitorFormData = HttpMonitorFormData | TcpMonitorFormData;

export default function NewMonitorPage() {
  const { type } = Route.useParams();
  const { workspaceName } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspaces();

  const handleSubmit = async (formData: MonitorFormData) => {
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

      const monitorRequest = {
        ...formData,
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

  if (type === "http") {
    return (
      <div className="container mx-auto max-w-5xl p-4">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-medium">Create HTTP Monitor</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure an HTTP/HTTPS endpoint monitor.
            </p>
          </div>
          <HttpMonitorForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitLabel="Create Monitor"
          />
        </div>
      </div>
    );
  } else if (type === "tcp") {
    return (
      <div className="container mx-auto max-w-5xl p-4">
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-medium">Create TCP Monitor</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure a TCP connection monitor.
            </p>
          </div>
          <TcpMonitorForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitLabel="Create Monitor"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-medium">Invalid Monitor Type</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            The specified monitor type is not supported.
          </p>
        </div>
      </div>
    </div>
  );
}
