"use client";

import { Button } from "@/frontend/components/ui/button";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { supabase } from "@/frontend/lib/supabase";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const { isLoading: authLoading } = useAuth();
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? "Signing in..." : "Continue with GitHub"}
        </Button>
      </div>
    </div>
  );
}
