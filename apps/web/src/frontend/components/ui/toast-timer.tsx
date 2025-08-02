import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./button";
import { X } from "lucide-react";

interface ToastTimerProps {
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  duration?: number; // in milliseconds
  variant?: "default" | "destructive";
}

function ToastTimerComponent({
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  duration = 10000,
  variant = "default",
}: ToastTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          // Check if less than 1 second remaining
          clearInterval(timer);
          onConfirm();
          toast.dismiss();
          return 0;
        }
        return prev - 1000; // Decrease by 1 second (1000ms)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onConfirm]);

  const handleCancel = () => {
    setIsActive(false);
    toast.dismiss();
  };

  const handleConfirm = () => {
    setIsActive(false);
    onConfirm();
    toast.dismiss();
  };

  const timeLeftSeconds = Math.ceil(timeLeft / 1000);

  return (
    <div className="bg-background space-y-2 rounded p-2 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span>Time remaining:</span>
        <span className="font-mono">{timeLeftSeconds}s</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={handleConfirm}
          className="flex-1"
        >
          {confirmText}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
        >
          {cancelText}
        </Button>
      </div>
    </div>
  );
}

export function showToastTimer(props: ToastTimerProps) {
  // Dismiss any existing toasts first to prevent multiple toasts
  toast.dismiss();

  toast.custom(() => <ToastTimerComponent {...props} />, {
    duration: Infinity, // Keep the toast open until user action or timer expires
  });
}
