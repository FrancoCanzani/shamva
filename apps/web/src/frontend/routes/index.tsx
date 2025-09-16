import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";
import { queryClient } from "@/frontend/lib/query-client";
import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "../components/landing-page";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        name: "description",
        content: "Uptime monitoring",
      },
      {
        title: "Shamva",
      },
    ],
  }),
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
