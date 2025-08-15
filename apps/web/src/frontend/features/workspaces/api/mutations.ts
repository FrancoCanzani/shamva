import { queryClient } from "@/frontend/lib/query-client";
import supabase from "@/frontend/lib/supabase";
import { Workspace, WorkspaceFormValues } from "@/frontend/types/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateWorkspace() {
  return useMutation({
    mutationFn: async (
      workspaceData: WorkspaceFormValues
    ): Promise<Workspace> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Failed to get authentication session");
      }

      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
      if (claimsError || !claimsData?.claims) {
        throw new Error("Failed to validate authentication claims");
      }

      const response = await fetch(`/api/workspaces`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      });
      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace created successfully");
    },
    onError: () => {
      toast.error("Failed to create workspace");
    },
  });
}

export function useUpdateWorkspace() {
  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: WorkspaceFormValues;
    }): Promise<Workspace> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Failed to get authentication session");
      }

      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
      if (claimsError || !claimsData?.claims) {
        throw new Error("Failed to validate authentication claims");
      }

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update workspace");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Workspace updated successfully");
    },
    onError: () => {
      toast.error("Failed to update workspace");
    },
  });
}

export function useDeleteWorkspace() {
  return useMutation({
    mutationFn: async (workspaceId: string): Promise<void> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Failed to get authentication session");
      }

      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
      if (claimsError || !claimsData?.claims) {
        throw new Error("Failed to validate authentication claims");
      }

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete workspace");
    },
  });
}
