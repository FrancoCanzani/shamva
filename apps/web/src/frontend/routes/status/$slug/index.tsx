import StatusPage from "@/frontend/features/status-pages/components/status-page";
import { createFileRoute } from "@tanstack/react-router";

export interface PublicStatusPageData {
  id: string;
  slug: string;
  title: string;
  description: string;
  show_values: boolean;
  monitors: Array<{
    id: string;
    name: string;
    status: string;
    [key: string]: unknown;
  }>;
  needsPassword: boolean;
}

interface StatusPageResponse {
  success: boolean;
  data?: PublicStatusPageData;
  error?: string;
}

export const Route = createFileRoute("/status/$slug/")({
  component: StatusPage,
  loader: async ({ params }): Promise<PublicStatusPageData> => {
    try {
      const response = await fetch(`/status/${params.slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Status page not found");
        }
        if (response.status === 403) {
          throw new Error("Status page is not public");
        }
        throw new Error(`Failed to load status page: ${response.status}`);
      }

      const result: StatusPageResponse = await response.json();

      if (!result.success && result.data && "requiresPassword" in result.data) {
        return {
          id: "",
          slug: params.slug,
          title: "",
          description: "",
          show_values: false,
          monitors: [],
          needsPassword: true,
        };
      }

      if (result.success && result.data && "monitors" in result.data) {
        return {
          ...result.data,
          needsPassword: false,
        };
      }

      throw new Error(result.error || "Failed to load status page");
    } catch (error) {
      console.error("Error loading status page:", error);
      throw error;
    }
  },
});
