import CollectorsPage from "@/frontend/features/collectors/components/collectors-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$workspaceName/collectors/")({
  component: CollectorsPage,
});
