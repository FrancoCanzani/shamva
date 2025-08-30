import { queryClient } from "@/frontend/lib/query-client";
import supabase from "@/frontend/lib/supabase";
import { StatusPage } from "@/frontend/lib/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateStatusPage() {
  return useMutation({
    mutationFn: async ({
      workspaceName,
      statusPageData,
    }: {
      workspaceName: string;
      statusPageData: {
        title: string;
        description: string;
        slug: string;
        is_public: boolean;
        show_values: boolean;
        password?: string;
        monitors: string[];
      };
    }): Promise<StatusPage> => {
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

      const response = await fetch(`/api/v1/status-pages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...statusPageData,
          workspaceName,
        }),
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
  return useMutation({
    mutationFn: async ({
      statusPageId,
      data,
    }: {
      statusPageId: string;
      data: {
        title: string;
        description: string;
        slug: string;
        is_public: boolean;
        show_values: boolean;
        password?: string;
        monitors: string[];
      };
    }): Promise<StatusPage> => {
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

      const response = await fetch(`/api/v1/status-pages/${statusPageId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
  return useMutation({
    mutationFn: async (statusPageId: string): Promise<void> => {
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

      const response = await fetch(`/api/v1/status-pages/${statusPageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete status page");
      }
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
