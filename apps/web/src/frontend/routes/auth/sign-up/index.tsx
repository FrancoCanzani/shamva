import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Separator } from "@/frontend/components/ui/separator";
import { Turnstile } from "@/frontend/components/ui/turnstile";
import supabase from "@/frontend/lib/supabase";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader, Mail } from "lucide-react";
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
    scripts: [
      {
        src: "https://challenges.cloudflare.com/turnstile/v0/api.js",
        async: true,
        defer: true,
      },
    ],
  }),
});

function SignupComponent() {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleGitHubSignup = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error("GitHub signup failed. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!turnstileToken && !import.meta.env.DEV) {
      toast.error("Please complete the security check");
      return;
    }

    setEmailLoading(true);
    try {
      if (!import.meta.env.DEV) {
        const validationResponse = await fetch(
          "/api/v1/auth/validate-turnstile",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: turnstileToken,
            }),
          }
        );

        if (!validationResponse.ok) {
          const validationError = await validationResponse.json();
          console.error("Turnstile validation failed:", validationError);
          toast.error("Security check failed. Please try again.");
          return;
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Email signup failed:", error);
        toast.error(error.message);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error("Email signup failed:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="text-green-600">
            <Mail className="mx-auto h-12 w-12" />
          </div>
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We've sent a confirmation link to <strong>{email}</strong>
          </p>
          <p className="text-muted-foreground text-xs">
            Click the link in your email to confirm your account. The link will
            expire in 1 hour.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(false);
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              setTurnstileToken(null);
            }}
            className="w-full"
          >
            Try a different email
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
              Sign up to get started with Shamva monitoring.
            </p>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onVerify={setTurnstileToken}
              onError={() =>
                toast.error("Security check failed. Please try again.")
              }
              onExpire={() => setTurnstileToken(null)}
            />
            <Button
              type="submit"
              disabled={
                emailLoading ||
                !email ||
                !password ||
                !confirmPassword ||
                (!turnstileToken && !import.meta.env.DEV)
              }
              className="w-full"
            >
              {emailLoading && <Loader className="animate-spin duration-75" />}
              {emailLoading ? "Creating account..." : "Create account"}
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

          <Button
            onClick={handleGitHubSignup}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <Loader className="animate-spin duration-75" />
            ) : (
              <img
                src={
                  "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github.svg"
                }
                alt="Github icon"
                className="h-4 w-4 dark:grayscale"
              />
            )}
            {loading ? "Signing up..." : "Continue with GitHub"}
          </Button>

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
