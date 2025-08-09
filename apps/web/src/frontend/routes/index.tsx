import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "../components/landing-page";
import { queryClient } from "@/frontend/lib/query-client";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";

export const Route = createFileRoute("/")({
  component: LandingPage,
  loader: async ({ context }) => {
    if (context.auth?.isAuthenticated) {
      await queryClient.ensureQueryData({
        queryKey: ["workspaces"],
        queryFn: fetchWorkspaces,
      });
      return queryClient.getQueryData(["workspaces"]) ?? [];
    }
    return [];
  },
});
