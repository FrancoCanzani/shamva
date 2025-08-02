import supabase from "@/frontend/lib/supabase";
import { MonitorFormData } from "@/frontend/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePauseResumeMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      monitorId,
      status,
    }: {
      monitorId: string;
      status: "active" | "paused";
    }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
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
    mutationFn: async (monitorId: string) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete monitor");
      }
      return response.json();
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

export function useCreateMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (monitorData: MonitorFormData) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/monitors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(monitorData),
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
    }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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
