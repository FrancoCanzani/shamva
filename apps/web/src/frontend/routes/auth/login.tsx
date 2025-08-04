import { Button } from "@/frontend/components/ui/button";
import supabase from "@/frontend/lib/supabase";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/auth/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [loading, setLoading] = useState(false);

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-start justify-start p-6">
      <h1
        className="text-3xl font-medium tracking-wide"
        style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
      >
        Shamva
      </h1>
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-10 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">Welcome to Shamva</h1>
            <p className="text-muted-foreground text-pretty">
              It's great to see you. Sign up to your account here.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <Button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="h-12 px-8"
            >
              {loading ? (
                <Loader className="animate-spin duration-75" />
              ) : (
                <img
                  src={
                    "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github-light.svg"
                  }
                  alt="Github icon"
                  className="h-4 w-4"
                />
              )}

              {loading ? "Signing in..." : "Continue with GitHub"}
            </Button>
          </div>
          <div className="text-muted-foreground text-center text-xs">
            By continuing, you acknowledge and accept our{" "}
            <Link to="/" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/" className="underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
