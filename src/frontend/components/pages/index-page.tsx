import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { useAuth } from "@/frontend/lib/context/auth-context";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  Code,
  Globe,
  Heart,
  Monitor,
  Users,
  Zap,
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
    <div className="min-h-screen w-full font-mono">
      <div className="relative z-10 max-w-5xl mx-auto min-h-screen">
        <div className="absolute left-0 top-0 h-full w-[2px] border-l border-dashed border-slate-400" />
        <div className="absolute right-0 top-0 h-full w-[2px] border-r border-dashed border-slate-400" />

        <header className="flex justify-between items-center p-6">
          <div className="flex items-center gap-2">
            <span className="uppercase text-sm sm:text-md text-slate-600">
              BLINKS
            </span>
          </div>
          <nav className="flex gap-4 items-center">
            {!authLoading && user ? (
              <Link to={dashboardLinkTo}>
                <Button
                  className="bg-black text-white hover:bg-black/90 px-4 py-2 text-xs sm:text-sm uppercase h-[30px]"
                  disabled={!user || workspacesLoading}
                >
                  {getDashboardButtonText()}
                </Button>
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="text-xs sm:text-sm uppercase hover:underline"
              >
                Login
              </Link>
            )}
          </nav>
        </header>

        <div className="px-6 space-y-10">
          <section className="pt-12">
            <h1 className="text-3xl sm:text-5xl font-mono mb-12 text-black uppercase tracking-normal">
              Monitor Everything
              <br />
              <span className="text-slate-600">Miss Nothing</span>
            </h1>
            <p className="text-sm sm:text-md mb-12 font-mono text-slate-600">
              Professional uptime monitoring with{" "}
              <span className="text-black">
                global edge deployment, intelligent health checks, and beautiful
                status pages
              </span>
              —built on Cloudflare's infrastructure for maximum reliability.
            </p>
            <p className="text-sm sm:text-md mb-12 font-mono text-slate-600">
              From simple website pings to complex API monitoring with{" "}
              <span className="text-black">
                custom headers, request bodies, and multi-region validation
              </span>{" "}
              for mission-critical services.
            </p>
          </section>

          <section className="py-8">
            <h2 className="text-lg uppercase mb-6">
              Why Developers Choose Blinks
            </h2>
            <div className="space-y-4">
              <div className="border hover:bg-gray-50 transition-colors">
                <div className="border-l-2 border-slate-400 py-6 px-6">
                  <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                    <Zap className="w-6 h-6 shrink-0 mr-2" />
                    Cloudflare Edge Network
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                    Built on Cloudflare Workers and Durable Objects for global
                    distribution, automatic failover, and sub-second response
                    times worldwide.
                  </p>
                </div>
              </div>

              <div className="border hover:bg-gray-50 transition-colors">
                <div className="border-l-2 border-slate-400 py-6 px-6">
                  <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                    <Globe className="w-6 h-6 shrink-0 mr-2" />
                    Multi-Region Monitoring
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                    Monitor from multiple global regions simultaneously. Detect
                    regional outages and ensure your services are accessible
                    everywhere.
                  </p>
                </div>
              </div>

              <div className="border hover:bg-gray-50 transition-colors">
                <div className="border-l-2 border-slate-400 py-6 px-6">
                  <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                    <Bell className="w-6 h-6 shrink-0 mr-2" />
                    Intelligent Health Checks
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                    Automated recovery system detects and restarts failed
                    monitors. Configurable failure thresholds prevent alert
                    fatigue.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-8">
            <h2 className="text-lg uppercase mb-6">
              Advanced Monitoring Capabilities
            </h2>
            <div className="space-y-6">
              <div className="border-t pt-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm uppercase font-mono font-medium w-1/3">
                    HTTP Methods
                  </h3>
                  <div className="flex flex-wrap gap-4 w-2/3">
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      GET / POST / HEAD
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Custom Headers
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Request Bodies
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm uppercase font-mono font-medium w-1/3">
                    Response Analysis
                  </h3>
                  <div className="flex flex-wrap gap-4 w-2/3">
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Status Code Validation
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Response Time Tracking
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Body Content Analysis
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-5 border-b pb-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs sm:text-sm uppercase font-mono font-medium w-1/3">
                    Monitoring Intervals
                  </h3>
                  <div className="flex flex-wrap gap-4 w-2/3">
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Custom Intervals
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Failure Detection
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-600">
                      Auto Recovery
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-8">
            <h2 className="text-lg uppercase mb-6">Platform Features</h2>
            <div className="space-y-4">
              <div className="border hover:bg-gray-50 transition-colors">
                <div className="border-l-2 border-slate-400 py-6 px-6">
                  <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                    <Users className="w-6 h-6 shrink-0 mr-2" />
                    Workspace Collaboration
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                    Organize monitors in workspaces with{" "}
                    <span className="font-bold">role-based access control</span>
                    . Admin, member, and viewer permissions for team management.
                  </p>
                </div>
              </div>

              <div className="border hover:bg-gray-50 transition-colors">
                <div className="border-l-2 border-slate-400 py-6 px-6">
                  <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                    <Monitor className="w-6 h-6 shrink-0 mr-2" />
                    Branded Status Pages
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                    Custom-branded public status pages with optional password
                    protection. Show uptime stats, response times, and incident
                    history.
                  </p>
                </div>
              </div>

              <div className="border hover:bg-gray-50 transition-colors">
                <div className="border-l-2 border-slate-400 py-6 px-6">
                  <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                    <BarChart3 className="w-6 h-6 shrink-0 mr-2" />
                    Comprehensive Analytics
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                    <span className="font-bold">30-day data retention</span>{" "}
                    with detailed logs, uptime percentages, response time
                    graphs, and daily breakdown statistics.
                  </p>
                </div>
              </div>

              <div className="border hover:bg-gray-50 transition-colors">
                <div className="border-l-2 border-slate-400 py-6 px-6">
                  <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                    <Clock className="w-6 h-6 shrink-0 mr-2" />
                    Flexible Scheduling
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                    Configurable check intervals from minutes to hours.
                    Intelligent failure detection with consecutive failure
                    thresholds.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-8">
            <h2 className="text-lg uppercase mb-6">Pricing Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Tier */}
              <div className="border text-black p-6 font-mono hover:bg-gray-50 transition-colors">
                <h3 className="text-lg uppercase font-semibold mb-1">
                  Individual
                </h3>
                <p className="text-sm mb-6">
                  Perfect for personal projects and small teams getting started.
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold mr-2">$0</span>
                  <span className="text-xs font-medium text-gray-700">
                    / forever
                  </span>
                </div>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Up to 2 monitors
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    10-minute check intervals
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    One region monitoring
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    15 days data retention
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Email alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />2 Status pages
                  </li>
                </ul>
                <Button
                  asChild
                  className="bg-black text-white rounded-none text-xs uppercase w-full"
                >
                  <Link to={dashboardLinkTo}>
                    {user ? "Current Plan" : "Start Free"}
                  </Link>
                </Button>
              </div>

              {/* Pro Tier */}
              <div className="border-2 border-black text-black p-6 font-mono hover:bg-gray-50 transition-colors relative">
                <div className="absolute -top-3 left-4 bg-black text-white px-3 py-1 text-xs uppercase">
                  Most Popular
                </div>
                <h3 className="text-lg uppercase font-semibold mb-1">Pro</h3>
                <p className="text-sm mb-6">
                  For growing teams and businesses with higher demands.
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold mr-2">$15</span>
                  <span className="text-xs font-medium text-gray-700">
                    / month
                  </span>
                </div>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Up to 10 monitors
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    5-minute check intervals
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />3 region monitoring
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    60-day data retention
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Email + Slack alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    10 Status pages
                  </li>
                </ul>
                <Button
                  asChild
                  className="bg-black text-white rounded-none text-xs uppercase w-full"
                >
                  <Link to="/auth/login">Upgrade to Pro</Link>
                </Button>
              </div>

              {/* Enterprise Tier */}
              <div className="border text-black p-6 font-mono hover:bg-gray-50 transition-colors">
                <h3 className="text-lg uppercase font-semibold mb-1">
                  Enterprise
                </h3>
                <p className="text-sm mb-6">
                  For large organizations with enterprise requirements.
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold mr-2">$50</span>
                  <span className="text-xs font-medium text-gray-700">
                    / month
                  </span>
                </div>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    50 monitors
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    60-second check intervals
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    90 days data retention
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Dedicated support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    On-premise deployment
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unlimited Status pages
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Custom slugs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Email + Slack alerts
                  </li>
                </ul>
                <Button
                  asChild
                  className="bg-black text-white rounded-none text-xs uppercase w-full"
                >
                  <a href="mailto:enterprise@blinks.dev">
                    Upgrade to Enterprise
                  </a>
                </Button>
              </div>
            </div>
          </section>

          <section className="py-8">
            <h2 className="text-lg uppercase mb-6">Open Source Foundation</h2>
            <div className="border hover:bg-gray-50 transition-colors">
              <div className="border-l-2 border-slate-400 py-6 px-6">
                <h3 className="uppercase text-sm font-mono font-medium mb-4 flex items-center">
                  <Code className="w-6 h-6 shrink-0 mr-2" />
                  Transparent & Extensible
                </h3>
                <div className="space-y-3 text-xs sm:text-sm font-mono text-slate-600 leading-relaxed">
                  <p>
                    <span className="text-black font-bold">
                      Built in the open
                    </span>{" "}
                    with full source code transparency. Review, contribute, and
                    customize the entire monitoring stack.
                  </p>
                  <p>
                    Deploy your own instance with complete control over data,
                    infrastructure, and feature development. No vendor lock-in,
                    ever.
                  </p>
                  <p className="flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-red-500" />
                    <span className="text-black">
                      Powered by Cloudflare Workers, Durable Objects, and
                      Supabase.
                    </span>
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-4">
                    <a
                      href="https://github.com/your-org/blinks"
                      className="uppercase text-xs font-mono font-medium underline hover:no-underline"
                    >
                      View Source
                    </a>
                    <a
                      href="https://docs.blinks.dev/self-hosting"
                      className="uppercase text-xs font-mono font-medium underline hover:no-underline"
                    >
                      Self-Host Guide
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-8">
            <h2 className="text-lg uppercase mb-6">Technical Foundation</h2>
            <div className="flex gap-1.5 items-center">
              <div>
                <h3 className="uppercase text-xs sm:text-sm font-mono font-medium mb-2">
                  Enterprise-Grade Open Source Architecture
                </h3>
                <div className="space-y-1 text-xs sm:text-sm font-mono text-slate-600">
                  <p>
                    <span className="text-black font-bold">Open source</span>{" "}
                    monitoring platform built on Cloudflare Workers with global
                    edge deployment.
                  </p>
                  <p>
                    Durable Objects ensure consistent monitoring state worldwide
                    with{" "}
                    <span className="text-black font-bold">
                      transparent, auditable code
                    </span>
                    .
                  </p>
                  <p>
                    Supabase backend with GitHub OAuth -
                    <span className="text-black font-bold">
                      {" "}
                      fully customizable and self-hostable
                    </span>
                    .
                  </p>
                  <p>
                    Automatic failover and intelligent health check recovery
                    with
                    <span className="text-black font-bold">
                      {" "}
                      community-driven improvements
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-md font-mono font-medium uppercase mb-3">
              Questions? Get in touch.
            </h2>
            <div className="flex gap-4">
              <a
                href="#"
                className="uppercase text-xs sm:text-sm font-mono font-medium underline"
              >
                Support.
              </a>
              <a
                href="#"
                className="uppercase text-xs sm:text-sm font-mono font-medium underline"
              >
                Docs.
              </a>
              <a
                href="https://github.com/your-org/blinks"
                className="uppercase text-xs sm:text-sm font-mono font-medium underline"
              >
                GitHub.
              </a>
            </div>
          </section>
        </div>

        <footer className="p-4 mt-8">
          <p className="text-xs sm:text-sm font-mono font-medium text-slate-400">
            © Blinks Monitoring. Open source uptime monitoring. 2024.
          </p>
        </footer>
      </div>
    </div>
  );
}
