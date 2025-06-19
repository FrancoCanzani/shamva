import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../lib/context/auth-context";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/auth/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "github",
      });

      if (signInError) throw signInError;
    } catch (error) {
      if (error instanceof Error) {
        console.error("GitHub Login Error:", error);
        const errorMessage =
          error.message || "Failed to initiate GitHub login.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        console.error("GitHub Login Error:", error);
        const errorMessage = "An unknown error occurred.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div>Loading authentication state...</div>;
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
      <div className="space-y-4">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <Button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? "Redirecting to GitHub..." : "Login with GitHub"}
        </Button>
      </div>
    </div>
  );
}
