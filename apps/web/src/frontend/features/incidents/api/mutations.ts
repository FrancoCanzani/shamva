import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/frontend/lib/supabase";
import { IncidentUpdateData, IncidentUpdate } from "../types";

export function useAcknowledgeIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string): Promise<void> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ acknowledged_at: new Date().toISOString() }),
      });
      if (!response.ok) {
        throw new Error("Failed to acknowledge incident");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident acknowledged");
    },
    onError: () => {
      toast.error("Failed to acknowledge incident");
    },
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string): Promise<void> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolved_at: new Date().toISOString() }),
      });
      if (!response.ok) {
        throw new Error("Failed to resolve incident");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident resolved");
    },
    onError: () => {
      toast.error("Failed to resolve incident");
    },
  });
}

export function useCreateIncidentUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      data,
    }: {
      incidentId: string;
      data: IncidentUpdateData;
    }): Promise<IncidentUpdate> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(`/api/incidents/${incidentId}/updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to post update");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Update posted");
    },
    onError: () => {
      toast.error("Failed to post update");
    },
  });
}

export function useDeleteIncidentUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      updateId,
    }: {
      incidentId: string;
      updateId: string;
    }): Promise<void> => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("Session Error or no token:", sessionError);
        throw new Error("Authentication required");
      }
      const token = session.access_token;
      const response = await fetch(
        `/api/incidents/${incidentId}/updates/${updateId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete update");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Update deleted");
    },
    onError: () => {
      toast.error("Failed to delete update");
    },
  });
}
