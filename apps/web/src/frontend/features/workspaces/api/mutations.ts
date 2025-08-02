import supabase from "@/frontend/lib/supabase";
import { Workspace, WorkspaceFormValues } from "@/frontend/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      workspaceData: WorkspaceFormValues
    ): Promise<Workspace> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/workspaces`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
  const queryClient = useQueryClient();

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
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string): Promise<void> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }
      return response.json();
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
