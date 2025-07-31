import { Button } from "@/frontend/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/frontend/components/ui/popover";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/frontend/utils/utils";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

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
      message: message.trim(),
    };

    const validationResult = feedbackSchema.safeParse(formData);

    if (!validationResult.success) {
      const messageError = validationResult.error.errors.find(
        (error) => error.path[0] === "message"
      );

      const errorMessage = messageError?.code === "too_small"
        ? "Please enter a message"
        : "Message must be 1000 characters or less";

      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-2">
            <label htmlFor="feedback-message" className="sr-only">
              Tell us more
            </label>
            <Textarea
              id="feedback-message"
              placeholder="Share your thoughts..."
              value={message}
              rows={6}
              onChange={(e) => setMessage(e.target.value)}
              className="field-sizing-content flex-1 resize-none rounded-none border-none p-0 text-xs shadow-none ring-0 placeholder:text-xs focus-visible:border-none focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <span
              className={cn(
                "text-muted-foreground text-xs",
                message.length > 1000 && "text-red-800"
              )}
            >
              {message.length}/1000 characters
            </span>

            <Button
              type="submit"
              variant={"outline"}
              size="xs"
              disabled={isSubmitting || message.length > 1000}
            >
              {isSubmitting ? "Submitting..." : <>Submit</>}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
