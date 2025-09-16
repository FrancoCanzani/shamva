import { useNavigate } from "@tanstack/react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { useWorkspaces } from "./use-workspaces";

export function useGlobalHotkeys() {
  const navigate = useNavigate();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaces();

  const handleWorkspaceSwitch = () => {
    if (!currentWorkspace || workspaces.length < 2) return;

    const currentIndex = workspaces.findIndex(
      (w) => w.id === currentWorkspace.id
    );
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % workspaces.length;
    const nextWorkspace = workspaces[nextIndex];

    setCurrentWorkspace(nextWorkspace);
  };

  const handleNavigateToSettings = () => {
    navigate({ to: "/dashboard/settings" });
  };

  const handleShowKeyboardShortcuts = () => {
    // TODO: Implement keyboard shortcuts modal/dialog
    console.log("Show keyboard shortcuts modal");
  };

  useHotkeys("shift+w", handleWorkspaceSwitch, {
    description: "Switch to next workspace",
    enableOnFormTags: false,
  });

  useHotkeys("meta+s", handleNavigateToSettings, {
    description: "Open settings",
    enableOnFormTags: false,
  });

  useHotkeys("meta+k", handleShowKeyboardShortcuts, {
    description: "Show keyboard shortcuts",
    enableOnFormTags: false,
    preventDefault: true,
  });
}
