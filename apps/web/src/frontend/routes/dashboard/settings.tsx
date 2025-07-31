import SettingsPage from "@/frontend/components/settings-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});
