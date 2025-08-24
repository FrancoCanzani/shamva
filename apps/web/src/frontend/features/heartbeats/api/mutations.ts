import { queryClient } from "@/frontend/lib/query-client";
import supabase from "@/frontend/lib/supabase";
import { Heartbeat } from "@/frontend/lib/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateHeartbeat() {
  return useMutation({
    mutationFn: async ({
      heartbeatData,
    }: {
      heartbeatData: {
        name: string;
        expectedLapseMs: number;
        gracePeriodMs: number;
        workspaceId: string;
        pingId: string;
      };
    }): Promise<Heartbeat> => {
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

      const response = await fetch(`/v1/api/heartbeats`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
  return useMutation({
    mutationFn: async ({
      heartbeatId,
      data,
    }: {
      heartbeatId: string;
      data: {
        name: string;
        expected_lapse_ms: number;
        grace_period_ms: number;
      };
    }): Promise<Heartbeat> => {
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

      const response = await fetch(`/v1/api/heartbeats/${heartbeatId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
  return useMutation({
    mutationFn: async (heartbeatId: string): Promise<void> => {
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

      const response = await fetch(`/v1/api/heartbeats/${heartbeatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete heartbeat");
      }
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
