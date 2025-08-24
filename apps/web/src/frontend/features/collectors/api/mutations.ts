import { queryClient } from "@/frontend/lib/query-client";
import supabase from "@/frontend/lib/supabase";
import { Collector, CollectorFormValues } from "@/frontend/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateCollector() {
  return useMutation({
    mutationFn: async ({
      workspaceId,
      collectorData,
    }: {
      workspaceId: string;
      collectorData: CollectorFormValues & { token?: string };
    }): Promise<Collector> => {
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

      const response = await fetch(`/v1/api/collectors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: collectorData.name,
          workspaceId,
          ...(collectorData.token && { token: collectorData.token }),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create collector");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors"] });
      toast.success("Collector created successfully");
    },
    onError: () => {
      toast.error("Failed to create collector");
    },
  });
}

export function useFetchCollectors(workspaceId: string) {
  return useQuery({
    queryKey: ["collectors", workspaceId],
    queryFn: async (): Promise<Collector[]> => {
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

      if (!workspaceId) {
        throw new Error("No workspace ID provided");
      }

      const response = await fetch(
        `/v1/api/collectors?workspaceId=${workspaceId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch collectors");
      }

      const result = (await response.json()) as {
        data: Collector[];
        success: boolean;
      };
      return result.data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useUpdateCollector() {
  return useMutation({
    mutationFn: async ({
      collectorId,
      data,
    }: {
      collectorId: string;
      data: CollectorFormValues;
    }): Promise<Collector> => {
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

      const response = await fetch(`/v1/api/collectors/${collectorId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update collector");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors"] });
      queryClient.invalidateQueries({ queryKey: ["collector"] });
      toast.success("Collector updated successfully");
    },
    onError: () => {
      toast.error("Failed to update collector");
    },
  });
}

export function useDeleteCollector() {
  return useMutation({
    mutationFn: async (collectorId: string): Promise<void> => {
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

      const response = await fetch(`/v1/api/collectors/${collectorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete collector");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors"] });
      toast.success("Collector deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete collector");
    },
  });
}
