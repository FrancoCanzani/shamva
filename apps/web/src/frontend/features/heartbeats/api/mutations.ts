import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/frontend/lib/supabase";
import { Heartbeat } from "@/frontend/types/types";
import { HeartbeatFormData } from "../types";

export function useCreateHeartbeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heartbeatData: HeartbeatFormData): Promise<Heartbeat> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/heartbeats`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(heartbeatData),
      });
      if (!response.ok) {
        throw new Error("Failed to create heartbeat");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heartbeats"] });
      toast.success("Heartbeat created successfully");
    },
    onError: () => {
      toast.error("Failed to create heartbeat");
    },
  });
}

export function useUpdateHeartbeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ heartbeatId, data }: { heartbeatId: string; data: HeartbeatFormData }): Promise<Heartbeat> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/heartbeats/${heartbeatId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update heartbeat");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heartbeats"] });
      queryClient.invalidateQueries({ queryKey: ["heartbeat"] });
      toast.success("Heartbeat updated successfully");
    },
    onError: () => {
      toast.error("Failed to update heartbeat");
    },
  });
}

export function useDeleteHeartbeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heartbeatId: string): Promise<void> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/heartbeats/${heartbeatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete heartbeat");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heartbeats"] });
      toast.success("Heartbeat deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete heartbeat");
    },
  });
} 