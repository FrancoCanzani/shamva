import { ApiResponse, Incident } from "@/frontend/lib/types";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

export function useCreateIncidentUpdate() {
  const context = useRouteContext({
    from: "/dashboard/$workspaceSlug/incidents/$id/",
  });
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      incidentId,
      content,
    }: {
      incidentId: string;
      content: string;
    }): Promise<Incident> => {
      if (!context.auth.session?.access_token || !context.auth.session.user) {
        throw new Error("Failed to get authentication session");
      }

      const user = context.auth.session.user as unknown as {
        email?: string | null;
        user_metadata?: Record<string, unknown>;
      };
      const email = user?.email ?? "";
      const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const authorName =
        (userMeta["full_name"] as string) ||
        (userMeta["name"] as string) ||
        (userMeta["user_name"] as string) ||
        (email ? (email.split("@")[0] as string) : "");

      const payload = {
        content,
        authorName: authorName || "User",
        authorEmail: email || "unknown@local",
      };

      const response = await fetch(`/api/v1/incidents/${incidentId}/updates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.auth.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `Failed to create incident update${errText ? `: ${errText}` : ""}`
        );
      }
      const result: ApiResponse<Incident> = await response.json();
      if (!result.data) {
        throw new Error("No data returned from server");
      }
      return result.data;
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Incident update created successfully");
    },
    onError: () => {
      toast.error("Failed to create incident update");
    },
  });
}

export function useUpdateIncident() {
  const context = useRouteContext({
    from: "/dashboard/$workspaceSlug/incidents/$id/",
  });
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      incidentId,
      data,
    }: {
      incidentId: string;
      data: { post_mortem?: string; screenshot_url?: string };
    }): Promise<Incident> => {
      if (!context.auth.session?.access_token) {
        throw new Error("Failed to get authentication session");
      }

      const response = await fetch(`/api/v1/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${context.auth.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update incident");
      }
      const result: ApiResponse<Incident> = await response.json();
      if (!result.data) {
        throw new Error("No data returned from server");
      }
      return result.data;
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Incident updated successfully");
    },
    onError: () => {
      toast.error("Failed to update incident");
    },
  });
}

export function useDeleteIncidentUpdate() {
  const context = useRouteContext({
    from: "/dashboard/$workspaceSlug/incidents/$id/",
  });
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      incidentId,
      updateId,
    }: {
      incidentId: string;
      updateId: string;
    }): Promise<void> => {
      if (!context.auth.session?.access_token) {
        throw new Error("Failed to get authentication session");
      }

      const response = await fetch(
        `/api/v1/incidents/${incidentId}/updates/${updateId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${context.auth.session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete incident update");
      }
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Incident update deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete incident update");
    },
  });
}

export function useAcknowledgeIncident() {
  const context = useRouteContext({
    from: "/dashboard/$workspaceSlug/incidents/$id/",
  });
  const router = useRouter();

  return useMutation({
    mutationFn: async (incidentId: string): Promise<Incident> => {
      if (!context.auth.session?.access_token) {
        throw new Error("Failed to get authentication session");
      }

      const response = await fetch(`/api/v1/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${context.auth.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acknowledged_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to acknowledge incident");
      }
      const result: ApiResponse<Incident> = await response.json();
      if (!result.data) {
        throw new Error("No data returned from server");
      }
      return result.data;
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Incident acknowledged successfully");
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to acknowledge incident");
    },
  });
}

export function useResolveIncident() {
  const context = useRouteContext({
    from: "/dashboard/$workspaceSlug/incidents/$id/",
  });
  const router = useRouter();

  return useMutation({
    mutationFn: async (incidentId: string): Promise<Incident> => {
      if (!context.auth.session?.access_token) {
        throw new Error("Failed to get authentication session");
      }

      const response = await fetch(`/api/v1/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${context.auth.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolved_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to resolve incident");
      }
      const result: ApiResponse<Incident> = await response.json();
      if (!result.data) {
        throw new Error("No data returned from server");
      }
      return result.data;
    },
    onSuccess: () => {
      router.invalidate();
      toast.success("Incident resolved successfully");
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to resolve incident");
    },
  });
}
