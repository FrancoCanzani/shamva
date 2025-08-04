import { Button } from "@/frontend/components/ui/button";
import { showToastTimer } from "@/frontend/components/ui/toast-timer";
import { Monitor } from "@/frontend/types/types";
import { Zap } from "lucide-react";
import { useState } from "react";
import { useDeleteMonitor, usePauseResumeMonitor } from "../../api/mutations";

interface FloatingActionsProps {
  selectedMonitors: Monitor[];
  onSelectionChange: () => void;
}

export default function FloatingActions({
  selectedMonitors,
  onSelectionChange,
}: FloatingActionsProps) {
  const [isDeleteToastOpen, setIsDeleteToastOpen] = useState(false);

  const pauseOrResumeMutation = usePauseResumeMonitor();
  const deleteMonitorMutation = useDeleteMonitor();

  const handlePauseOrResume = (monitorId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "active" : "paused";
    pauseOrResumeMutation.mutate({
      monitorId,
      status: newStatus as "active" | "paused",
    });
  };

  const handleBulkPause = () => {
    selectedMonitors.forEach((monitor) => {
      if (monitor.status !== "error") {
        handlePauseOrResume(monitor.id, monitor.status);
      }
    });
    onSelectionChange();
  };

  const handleBulkResume = () => {
    selectedMonitors.forEach((monitor) => {
      if (monitor.status === "paused") {
        handlePauseOrResume(monitor.id, monitor.status);
      }
    });
    onSelectionChange();
  };

  const handleBulkDelete = () => {
    selectedMonitors.forEach((monitor) => {
      deleteMonitorMutation.mutate(monitor.id);
    });
    onSelectionChange();
  };

  const canPause = selectedMonitors.some((m) => m.status !== "paused");
  const canResume = selectedMonitors.some((m) => m.status === "paused");

  if (selectedMonitors.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-white/10 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-xl">
      <Zap className="h-3 w-3" />
      <span className="text-xs font-medium">Quick actions</span>
      <Button
        variant="outline"
        size="xs"
        onClick={handleBulkPause}
        disabled={!canPause}
        className="h-6 px-2 text-xs"
      >
        Pause
      </Button>

      <Button
        variant="outline"
        size="xs"
        onClick={handleBulkResume}
        disabled={!canResume}
        className="h-6 px-2 text-xs"
      >
        Resume
      </Button>

      <Button
        variant="destructive"
        size="xs"
        onClick={() => {
          if (isDeleteToastOpen) return;
          setIsDeleteToastOpen(true);
          showToastTimer({
            title: "Delete Selected Monitors",
            description: `Are you sure you want to delete ${selectedMonitors.length} monitor(s)?`,
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "destructive",
            onConfirm: () => {
              handleBulkDelete();
              setIsDeleteToastOpen(false);
            },
            duration: 500000,
          });
        }}
        className="h-6 px-2 text-xs"
      >
        Delete
      </Button>
    </div>
  );
}
