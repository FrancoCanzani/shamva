import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { Link, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Clock,
  Globe,
  Heart,
  Monitor,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "./ui/button";

export default function IndexPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const router = useRouter();

  useEffect(() => {
    if (user && !workspacesLoading && workspaces && workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      const workspaceName = firstWorkspace.name;

      // Preload monitors route
      router.preloadRoute({
        to: "/dashboard/$workspaceName/monitors",
        params: { workspaceName },
      });
    }
  }, [user, workspacesLoading, workspaces, router]);

  let dashboardLinkTo = "/auth/login";
  if (!authLoading && user) {
    if (workspacesLoading) {
      dashboardLinkTo = "#";
    } else if (workspaces && workspaces.length > 0) {
      const firstworkspaceName = workspaces[0].name;
      dashboardLinkTo = `/dashboard/${firstworkspaceName}/monitors`;
    } else {
      dashboardLinkTo = "/dashboard/workspaces/new";
    }
  }

  const getDashboardButtonText = () => {
    if (!user) return "Get Started";
    if (workspacesLoading) return "Loading...";
    return "Go to Dashboard";
  };

  return (
    <div className="bg-background mx-auto min-h-screen max-w-4xl p-4">
      <div className="">
        <header className="py-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center">
                <Heart className="text-primary-foreground h-5 w-5" />
              </div>
              <span
                className="tracking-wide[-5px] text-xl font-bold"
                style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
              >
                Shamva
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Button asChild>
                  <Link to={dashboardLinkTo}>{getDashboardButtonText()}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth/login">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="space-y-8 py-20 text-center">
          <div className="space-y-4">
            <h1 className="text-foreground text-4xl font-medium">
              Monitor Your Services
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Shamva provides real-time monitoring, instant alerts, and
              comprehensive incident management to keep your services running
              smoothly.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link to="/auth/login">Start Monitoring</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com/your-org/shamva"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Source
              </a>
            </Button>
          </div>
        </main>

        <section className="space-y-8 py-20">
          <div className="space-y-4 text-center">
            <h2 className="text-foreground text-2xl font-medium">
              Everything You Need for Reliable Monitoring
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              From simple uptime checks to complex incident management, Shamva
              has you covered.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4 border border-dashed p-6">
              <div className="bg-muted flex h-12 w-12 items-center justify-center">
                <Monitor className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-medium">
                  Real-time Monitoring
                </h3>
                <p className="text-muted-foreground text-sm">
                  Monitor your services from multiple global locations with
                  configurable check intervals and custom thresholds.
                </p>
              </div>
            </div>

            <div className="space-y-4 border border-dashed p-6">
              <div className="bg-muted flex h-12 w-12 items-center justify-center">
                <Bell className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-medium">
                  Instant Alerts
                </h3>
                <p className="text-muted-foreground text-sm">
                  Get notified immediately when issues are detected via email,
                  Slack, or custom webhooks.
                </p>
              </div>
            </div>

            <div className="space-y-4 border border-dashed p-6">
              <div className="bg-muted flex h-12 w-12 items-center justify-center">
                <BarChart3 className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-medium">
                  Performance Analytics
                </h3>
                <p className="text-muted-foreground text-sm">
                  Track response times, uptime percentages, and performance
                  trends with detailed analytics and charts.
                </p>
              </div>
            </div>

            <div className="space-y-4 border border-dashed p-6">
              <div className="bg-muted flex h-12 w-12 items-center justify-center">
                <Clock className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-medium">
                  Incident Management
                </h3>
                <p className="text-muted-foreground text-sm">
                  Track incidents from detection to resolution with detailed
                  timelines and post-mortem documentation.
                </p>
              </div>
            </div>

            <div className="space-y-4 border border-dashed p-6">
              <div className="bg-muted flex h-12 w-12 items-center justify-center">
                <Globe className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-medium">
                  Global Coverage
                </h3>
                <p className="text-muted-foreground text-sm">
                  Monitor from multiple regions to ensure your services are
                  accessible worldwide.
                </p>
              </div>
            </div>

            <div className="space-y-4 border border-dashed p-6">
              <div className="bg-muted flex h-12 w-12 items-center justify-center">
                <Users className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-foreground text-lg font-medium">
                  Team Collaboration
                </h3>
                <p className="text-muted-foreground text-sm">
                  Invite team members with different permission levels and
                  collaborate on monitoring and incident response.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="space-y-8 border border-dashed p-12">
            <div className="space-y-4">
              <h2 className="text-foreground text-2xl font-medium">
                Ready to Start Monitoring?
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                Join thousands of teams who trust Shamva to keep their services
                running smoothly.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to="/auth/login">Get Started Free</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary flex h-6 w-6 items-center justify-center">
                <Heart className="text-primary-foreground h-4 w-4" />
              </div>
              <span
                className="text-foreground tracking-wide[-5px] text-lg font-bold"
                style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
              >
                Shamva
              </span>
            </div>
            <div className="text-muted-foreground flex items-center space-x-6 text-sm">
              <a
                href="https://github.com/your-org/shamva"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Documentation
              </a>
              <Link to="/auth/login" className="hover:text-foreground">
                Sign In
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
