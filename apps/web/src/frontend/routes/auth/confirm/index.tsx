import { Button } from "@/frontend/components/ui/button";
import supabase from "@/frontend/lib/supabase";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/confirm/")({
  component: ConfirmComponent,
  head: () => ({
    title: "Confirming - Shamva",
    meta: [
      {
        name: "description",
        content: "Confirming your authentication with Shamva.",
      },
    ],
  }),
});

function ConfirmComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthConfirm = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const type = urlParams.get("type");

        if (!token || !type) {
          setError("Invalid confirmation link");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as "email",
        });

        if (error) {
          console.error("Confirmation failed:", error);
          setError(error.message);
        } else {
          toast.success("Successfully signed in!");
          navigate({ to: "/dashboard" });
        }
      } catch (err) {
        console.error("Confirmation error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    handleAuthConfirm();
  }, [navigate]);

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Confirming your sign in</h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Confirmation failed</h1>
            <p className="text-muted-foreground text-pretty">{error}</p>
          </div>
          <Button asChild className="w-full">
            <a href="/auth/log-in">Back to Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Success!</h1>
          <p className="text-muted-foreground">
            You have been successfully signed in. Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}
