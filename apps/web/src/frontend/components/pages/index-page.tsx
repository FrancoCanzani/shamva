import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Clock,
  Globe,
  Heart,
  Monitor,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";

export default function IndexPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();

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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <header className="py-8">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-medium">Shamva</span>
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

        {/* Hero Section */}
        <main className="py-20 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-medium text-foreground">
              Monitor Your Services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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

        {/* Features Section */}
        <section className="py-20 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-medium text-foreground">
              Everything You Need for Reliable Monitoring
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From simple uptime checks to complex incident management, Shamva
              has you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="border border-dashed p-6 space-y-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center">
                <Monitor className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Real-time Monitoring
                </h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your services from multiple global locations with
                  configurable check intervals and custom thresholds.
                </p>
              </div>
            </div>

            <div className="border border-dashed p-6 space-y-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Instant Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get notified immediately when issues are detected via email,
                  Slack, or custom webhooks.
                </p>
              </div>
            </div>

            <div className="border border-dashed p-6 space-y-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Performance Analytics
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track response times, uptime percentages, and performance
                  trends with detailed analytics and charts.
                </p>
              </div>
            </div>

            <div className="border border-dashed p-6 space-y-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Incident Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track incidents from detection to resolution with detailed
                  timelines and post-mortem documentation.
                </p>
              </div>
            </div>

            <div className="border border-dashed p-6 space-y-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center">
                <Globe className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Global Coverage
                </h3>
                <p className="text-sm text-muted-foreground">
                  Monitor from multiple regions to ensure your services are
                  accessible worldwide.
                </p>
              </div>
            </div>

            <div className="border border-dashed p-6 space-y-4">
              <div className="w-12 h-12 bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Team Collaboration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Invite team members with different permission levels and
                  collaborate on monitoring and incident response.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="border border-dashed p-12 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-medium text-foreground">
                Ready to Start Monitoring?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
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
        <footer className="py-12 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-medium text-foreground">
                Shamva
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
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
