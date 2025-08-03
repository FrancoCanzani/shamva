import { useRouteContext } from "@tanstack/react-router";
import { toast } from "sonner";
import supabase from "../lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export default function SettingsPage() {
  const { auth } = useRouteContext({
    from: "/dashboard",
  });

  const user = auth.user!;

  if (!user) return;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      toast.error("Error signing out. Please try again.");
    }
  };

  const handleUpgrade = () => {
    console.log("Upgrade subscription");
  };

  const handleCancelSubscription = () => {
    console.log("Cancel subscription");
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium">Settings</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account settings and billing.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <h2>Account</h2>

          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.name}
              />
              <AvatarFallback>FC</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.user_metadata.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-muted-foreground text-xs">
                Sign out of your account
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2>Billing</h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Current Plan</p>
                <Badge variant="secondary">Free</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Basic features included
              </p>
            </div>
            <Button size="sm" onClick={handleUpgrade}>
              Upgrade
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cancel subscription</p>
              <p className="text-muted-foreground text-xs">
                End your current billing cycle
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelSubscription}
              className="text-destructive hover:text-destructive bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
