import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Separator } from "@/frontend/components/ui/separator";
import { Turnstile } from "@/frontend/components/ui/turnstile";
import supabase from "@/frontend/lib/supabase";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/sign-up/")({
  component: SignupComponent,
  head: () => ({
    title: "Sign Up - Shamva",
    meta: [
      {
        name: "description",
        content:
          "Create a new Shamva account to start monitoring your applications and infrastructure.",
      },
    ],
  }),
});

function SignupComponent() {
  const [emailLoading, setEmailLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleGithubSignup = async () => {
    setGithubLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error("GitHub signup failed:", error);
      toast.error("GitHub signup failed. Please try again.");
      setGithubLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      // Mock Google auth - not implemented
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.error("Google authentication is not implemented yet");
    } catch (error) {
      console.error("Google signup failed:", error);
      toast.error("Google signup failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMagicLinkSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!import.meta.env.DEV && !turnstileToken) {
      toast.error("Please complete the security check");
      return;
    }

    setEmailLoading(true);
    try {
      const authOptions: { captchaToken?: string; shouldCreateUser?: boolean } =
        {
          shouldCreateUser: true,
        };

      // In development, use a mock token; in production, use the actual token
      if (import.meta.env.DEV) {
        authOptions.captchaToken = "dev-token";
      } else if (turnstileToken) {
        authOptions.captchaToken = turnstileToken;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: authOptions,
      });

      if (error) {
        console.error("Magic link signup failed:", error);
        toast.error(error.message);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error("Magic link signup failed:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <h1 className="text-3xl font-semibold">Welcome to Shamva</h1>
          <p className="text-muted-foreground text-xl">
            Check your email. We've sent a magic link to{" "}
            <strong>{email}</strong>
          </p>
          <p className="text-muted-foreground text-sm text-pretty">
            Click the link in your email to create your account. The link will
            expire in 1 hour.
          </p>
          <Button asChild>
            <Link
              to="/"
              onClick={() => {
                setSuccess(false);
                setEmail("");
                setTurnstileToken(null);
              }}
              className="w-full hover:underline"
            >
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-start justify-start p-2 sm:p-6">
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">Create your account</h1>
            <p className="text-muted-foreground text-pretty">
              Enter your email to get started with Shamva monitoring.
            </p>
          </div>

          <form onSubmit={handleMagicLinkSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!import.meta.env.DEV && (
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onError={() =>
                  toast.error("Security check failed. Please try again.")
                }
                onExpire={() => setTurnstileToken(null)}
              />
            )}
            <Button
              type="submit"
              disabled={
                emailLoading ||
                !email ||
                (!import.meta.env.DEV && !turnstileToken)
              }
              className="w-full"
            >
              {emailLoading && <Loader className="animate-spin duration-75" />}
              {emailLoading ? "Sending magic link..." : "Create account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGithubSignup}
              disabled={githubLoading}
              variant="outline"
              className="w-full"
            >
              {githubLoading ? (
                <Loader className="animate-spin duration-75" />
              ) : (
                <img
                  src={
                    "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github.svg"
                  }
                  alt="GitHub icon"
                  className="h-4 w-4 dark:grayscale"
                />
              )}
              {githubLoading ? "Signing up..." : "Continue with GitHub"}
            </Button>

            <Button
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              variant="outline"
              className="w-full"
            >
              {googleLoading ? (
                <Loader className="animate-spin duration-75" />
              ) : (
                <img
                  src={
                    "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google.svg"
                  }
                  alt="Google icon"
                  className="h-4 w-4"
                />
              )}
              {googleLoading ? "Signing up..." : "Continue with Google"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link to="/auth/log-in" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="text-muted-foreground text-center text-xs text-pretty">
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
