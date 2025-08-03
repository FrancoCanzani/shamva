import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import supabase from "@/frontend/lib/supabase";
import { Monitor, MonitorFormData } from "@/frontend/types/types";

export function useCreateMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceName,
      monitorData,
    }: {
      workspaceName: string;
      monitorData: MonitorFormData;
    }): Promise<Monitor> => {
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
      
      const response = await fetch(`/api/monitors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...monitorData,
          workspaceName,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create monitor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitors"] });
      toast.success("Monitor created successfully");
    },
    onError: () => {
      toast.error("Failed to create monitor");
    },
  });
}

export function useUpdateMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monitorId,
      data,
    }: {
      monitorId: string;
      data: MonitorFormData;
    }): Promise<Monitor> => {
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
      
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update monitor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitors"] });
      queryClient.invalidateQueries({ queryKey: ["monitor"] });
      toast.success("Monitor updated successfully");
    },
    onError: () => {
      toast.error("Failed to update monitor");
    },
  });
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (monitorId: string): Promise<void> => {
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
      
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete monitor");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitors"] });
      toast.success("Monitor deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete monitor");
    },
  });
}

export function usePauseResumeMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monitorId,
      status,
    }: {
      monitorId: string;
      status: "active" | "paused";
    }): Promise<Monitor> => {
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
      
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update monitor status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitors"] });
      queryClient.invalidateQueries({ queryKey: ["monitor"] });
      toast.success("Monitor status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update monitor status");
    },
  });
}
