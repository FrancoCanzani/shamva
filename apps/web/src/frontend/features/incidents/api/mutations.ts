import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import supabase from "@/frontend/lib/supabase";
import { Incident } from "@/frontend/types/types";

export function useCreateIncidentUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      update,
    }: {
      incidentId: string;
      update: {
        message: string;
        status: "investigating" | "identified" | "monitoring" | "resolved";
      };
    }): Promise<Incident> => {
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
      
      const response = await fetch(`/api/incidents/${incidentId}/updates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(update),
      });
      if (!response.ok) {
        throw new Error("Failed to create incident update");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident update created successfully");
    },
    onError: () => {
      toast.error("Failed to create incident update");
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentId,
      data,
    }: {
      incidentId: string;
      data: { post_mortem?: string; screenshot_url?: string };
    }): Promise<Incident> => {
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
      
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update incident");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident updated successfully");
    },
    onError: () => {
      toast.error("Failed to update incident");
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
        throw new Error("Failed to get authentication session");
      }

      
      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
      if (claimsError || !claimsData?.claims) {
        throw new Error("Failed to validate authentication claims");
      }
      
      const response = await fetch(
        `/api/incidents/${incidentId}/updates/${updateId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete incident update");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident update deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete incident update");
    },
  });
}

export function useAcknowledgeIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string): Promise<Incident> => {
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
      
      const response = await fetch(`/api/incidents/${incidentId}/acknowledge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to acknowledge incident");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident acknowledged successfully");
    },
    onError: () => {
      toast.error("Failed to acknowledge incident");
    },
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string): Promise<Incident> => {
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
      
      const response = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to resolve incident");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident"] });
      toast.success("Incident resolved successfully");
    },
    onError: () => {
      toast.error("Failed to resolve incident");
    },
  });
}
