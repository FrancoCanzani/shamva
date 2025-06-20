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
    if (workspaces && workspaces.length > 0) return "Go to Dashboard";
    return "Create Workspace";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-8">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Shamva</span>
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
        <main className="py-20 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Monitor Your Services
            <br />
            <span className="text-blue-600">Like Never Before</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Shamva provides real-time monitoring, instant alerts, and comprehensive
            incident management to keep your services running smoothly.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link to="/auth/login">Start Monitoring</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/your-org/shamva" target="_blank" rel="noopener noreferrer">View Source</a>
            </Button>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Reliable Monitoring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From simple uptime checks to complex incident management, Shamva has
              you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time Monitoring
              </h3>
              <p className="text-gray-600">
                Monitor your services from multiple global locations with
                configurable check intervals and custom thresholds.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant Alerts
              </h3>
              <p className="text-gray-600">
                Get notified immediately when issues are detected via email,
                Slack, or custom webhooks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Performance Analytics
              </h3>
              <p className="text-gray-600">
                Track response times, uptime percentages, and performance trends
                with detailed analytics and charts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Incident Management
              </h3>
              <p className="text-gray-600">
                Track incidents from detection to resolution with detailed
                timelines and post-mortem documentation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Global Coverage
              </h3>
              <p className="text-gray-600">
                Monitor from multiple regions to ensure your services are
                accessible worldwide.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Team Collaboration
              </h3>
              <p className="text-gray-600">
                Invite team members with different permission levels and
                collaborate on monitoring and incident response.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="bg-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Monitoring?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of teams who trust Shamva to keep their services
              running smoothly.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth/login">Get Started Free</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Shamva</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <a href="https://github.com/your-org/shamva" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                Documentation
              </a>
              <Link to="/auth/login" className="hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
