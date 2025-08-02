import supabase from "@/frontend/lib/supabase";
import { StatusPage, StatusPageFormValues } from "@/frontend/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateStatusPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      statusPageData: StatusPageFormValues
    ): Promise<StatusPage> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/status-pages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusPageData),
      });
      if (!response.ok) {
        throw new Error("Failed to create status page");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-pages"] });
      toast.success("Status page created successfully");
    },
    onError: () => {
      toast.error("Failed to create status page");
    },
  });
}

export function useUpdateStatusPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      statusPageId,
      data,
    }: {
      statusPageId: string;
      data: StatusPageFormValues;
    }): Promise<StatusPage> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/status-pages/${statusPageId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update status page");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-pages"] });
      queryClient.invalidateQueries({ queryKey: ["status-page"] });
      toast.success("Status page updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status page");
    },
  });
}

export function useDeleteStatusPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusPageId: string): Promise<void> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/status-pages/${statusPageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete status page");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-pages"] });
      toast.success("Status page deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete status page");
    },
  });
}
