import { Route } from "@/frontend/routes/dashboard/$workspaceName/incidents/$id";
import { ApiResponse } from "@/frontend/types/types";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";

type AiAnalysis = {
  rootCause: string;
  solutions: string[];
  prevention: string[];
  confidence: number;
  summary: string;
};

export const useAiCheck = () => {
  const { auth } = useRouteContext({
    from: "/dashboard/$workspaceName/incidents/$id/",
  });
  const { id } = Route.useParams();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/incidents/${id}/ai-check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ incidentId: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze incident");
      }

      const result: ApiResponse<AiAnalysis> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to analyze incident");
      }
      return result.data!;
    },
    onSuccess: () => {
      router.invalidate();
    },
  });
};
