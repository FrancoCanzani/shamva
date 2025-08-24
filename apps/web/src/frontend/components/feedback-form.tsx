import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/frontend/lib/utils";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const feedbackSchema = z.object({
  message: z.string().min(1).max(1000),
});

export function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { auth } = useRouteContext({
    from: "/dashboard",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      message: message,
    };

    const validationResult = feedbackSchema.safeParse(formData);

    if (!validationResult.success) {
      const messageError = validationResult.error.issues.find(
        (error) => error.path[0] === "message"
      );

      const errorMessage =
        messageError?.code === "too_small"
          ? "Please enter a message"
          : "Message must be 1000 characters or less";

      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/v1/api/feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("");
        setIsOpen(false);
        toast.success("Feedback submitted successfully!");
      } else {
        const errorData = await response.json();
        console.error("Failed to submit feedback:", errorData);
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="p-2 sm:max-w-xl [&>button:last-child]:hidden">
        <DialogHeader className="gap-1 p-2">
          <DialogTitle className="font-medium">Feedback</DialogTitle>
          <DialogDescription className="text-xs">
            What do you think?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 px-2">
          <div className="grid gap-2">
            <label
              htmlFor="feedback-from"
              className="text-muted-foreground text-xs"
            >
              From
            </label>
            <span className="text-muted-foreground rounded border p-2 text-xs">
              {auth.session?.user?.email}
            </span>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="feedback-to"
              className="text-muted-foreground text-xs"
            >
              To
            </label>
            <span className="text-muted-foreground rounded border p-2 text-xs">
              feedback@shamva.app
            </span>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="feedback-subject"
              className="text-muted-foreground text-xs"
            >
              Subject
            </label>
            <span className="text-muted-foreground rounded border p-2 text-xs">
              Feedback
            </span>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="feedback-message"
              className="text-muted-foreground text-xs"
            >
              Message
            </label>
            <Textarea
              id="feedback-message"
              className="text-xs placeholder:text-xs"
              placeholder="Write your message..."
              value={message}
              rows={10}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter className="items-center pb-2">
            <span
              className={cn(
                "text-muted-foreground mr-auto text-xs",
                message.length > 1000 && "text-red-800"
              )}
            >
              {message.length}/1000 characters
            </span>
            <div className="flex items-center gap-x-1.5">
              <Button
                variant={"ghost"}
                size="xs"
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setMessage("");
                  setIsOpen(false);
                }}
              >
                Close
              </Button>
              <Button
                type="submit"
                size="xs"
                disabled={
                  isSubmitting || message.length === 0 || message.length > 1000
                }
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
