"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../lib/context/auth-context";
import { supabase } from "../../lib/supabase";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center space-y-2">
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
