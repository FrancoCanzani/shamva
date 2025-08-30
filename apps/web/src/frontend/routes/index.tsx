import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "../components/landing-page";
import { queryClient } from "@/frontend/lib/query-client";
import fetchWorkspaces from "@/frontend/features/workspaces/api/workspaces";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    title: "Shamva - Modern Monitoring & Observability Platform",
    meta: [
      {
        name: "description",
        content:
          "Shamva is a modern monitoring and observability platform that helps you track, monitor, and alert on your applications and infrastructure with ease.",
      },
      {
        property: "og:title",
        content: "Shamva - Modern Monitoring & Observability Platform",
      },
      {
        property: "og:description",
        content:
          "Shamva is a modern monitoring and observability platform that helps you track, monitor, and alert on your applications and infrastructure with ease.",
      },
      {
        property: "og:type",
        content: "website",
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
