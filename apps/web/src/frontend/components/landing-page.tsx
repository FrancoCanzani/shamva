import { useWorkspaces } from "@/frontend/hooks/use-workspaces";
import { Route } from "@/frontend/routes";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ThemeToggle } from "./ui/theme-toggle";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const seededWorkspaces = Route.useLoaderData();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();

  let dashboardLinkTo = "/auth/log-in";

  if (!isLoading && isAuthenticated && !workspacesLoading) {
    const list =
      workspaces && workspaces.length > 0 ? workspaces : seededWorkspaces || [];
    if (list.length > 0) {
      const firstworkspaceSlug = list[0].slug;
      dashboardLinkTo = `/dashboard/${firstworkspaceSlug}/monitors`;
    } else {
      dashboardLinkTo = "/dashboard/workspaces/new";
    }
  }

  const getDashboardButtonText = () => {
    if (!isAuthenticated) return "Get Started";
    if (isLoading || workspacesLoading) return "Loading...";
    return "Go to Dashboard";
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-5xl p-2 sm:p-6">
      <div
        className="pointer-events-none fixed inset-0 z-[-1]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "100px 80px",
          backgroundPosition: "0 0",
          opacity: 0.3,
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
        }}
      />
              <div
          className="pointer-events-none fixed inset-0 z-[-1] hidden dark:block"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 255, 255, 0.1), transparent 70%), #000000",
          }}
        />
      <header className="py-8">
        <nav className="flex items-center justify-between">
          <a
            href="https://github.com/FrancoCanzani/shamva"
            target="_blank"
            className="group text-muted-foreground inline-flex items-center justify-start gap-x-2 font-mono text-sm tracking-tighter"
          >
            Shamva is <span className="underline">Open Source</span>
            <ArrowRight className="h-3 w-3 transition duration-200 group-hover:translate-x-1" />
          </a>
          <div className="text-muted-foreground flex items-center justify-end gap-3 text-sm">
            <a href="#" className="hover:underline">
              Docs
            </a>
            <a href="#pricing" className="hover:underline">
              Pricing
            </a>
            <ThemeToggle className="h-7 w-7" />
          </div>
        </nav>
      </header>

      <main className="space-y-10 py-16">
        <div className="space-y-6">
          <h1
            className="text-3xl font-medium tracking-wide"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            Shamva
          </h1>
          <h2 className="text-foreground text-6xl font-medium text-pretty">
            Monitoring infraestracture that scales with your business
          </h2>
          <p className="max-w-2xl tracking-tighter">
            Shamva provides real-time monitoring, instant alerts, and
            comprehensive incident management to keep your services running
            smoothly.
          </p>
        </div>
        <Button asChild size={"lg"}>
          <Link to={dashboardLinkTo} preload="render">
            {getDashboardButtonText()}
          </Link>
        </Button>
      </main>

      <section className="py-16">
        <div className="text-muted-foreground flex h-60 w-full items-center justify-center rounded-md border p-4 text-xs shadow lg:h-[35rem]">
          Screenshot here
        </div>
      </section>

      <section className="space-y-8 py-16">
        <div className="space-y-6">
          <h2 className="text-foreground text-2xl font-medium">
            Everything You Need for Reliable Monitoring
          </h2>
          <p className="max-w-xl tracking-tighter">
            From simple uptime checks to complex incident management, Shamva has
            you covered.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-stone-50 p-4">
            <div className="space-y-2">
              <h3 className="text-foreground font-medium">
                Real-time Monitoring
              </h3>
              <p className="text-muted-foreground text-xs">
                Monitor your services from multiple global locations with
                configurable check intervals and custom thresholds.
              </p>
            </div>
          </Card>

          <Card className="bg-stone-50 p-4">
            <div className="space-y-2">
              <h3 className="text-foreground font-medium">Instant Alerts</h3>
              <p className="text-muted-foreground text-xs">
                Get notified immediately when issues are detected via email,
                Slack, or custom webhooks.
              </p>
            </div>
          </Card>

          <Card className="bg-stone-50 p-4">
            <div className="space-y-2">
              <h3 className="text-foreground font-medium">
                Performance Analytics
              </h3>
              <p className="text-muted-foreground text-xs">
                Track response times, uptime percentages, and performance trends
                with detailed analytics and charts.
              </p>
            </div>
          </Card>

          <Card className="bg-stone-50 p-4">
            <div className="space-y-2">
              <h3 className="text-foreground font-medium">
                Incident Management
              </h3>
              <p className="text-muted-foreground text-xs">
                Track incidents from detection to resolution with detailed
                timelines and post-mortem documentation.
              </p>
            </div>
          </Card>

          <Card className="bg-stone-50 p-4">
            <div className="space-y-2">
              <h3 className="text-foreground font-medium">Global Coverage</h3>
              <p className="text-muted-foreground text-xs">
                Monitor from multiple regions to ensure your services are
                accessible worldwide.
              </p>
            </div>
          </Card>

          <Card className="bg-stone-50 p-4">
            <div className="space-y-2">
              <h3 className="text-foreground font-medium">
                Team Collaboration
              </h3>
              <p className="text-muted-foreground text-xs">
                Invite team members with different permission levels and
                collaborate on monitoring and incident response.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-16">
        <div className="space-y-6">
          <h2 className="text-foreground w-fit bg-stone-50 text-xl font-medium underline underline-offset-4">
            How it works
          </h2>
          <div className="max-w-2xl space-y-6">
            <div className="flex items-start space-x-2">
              <div className="text-foreground">1.</div>
              <div>
                <h3 className="text-foreground font-medium">Set up monitors</h3>
                <p className="text-muted-foreground text-sm">
                  Configure HTTP or TCP monitors with custom intervals and
                  global regions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="text-foreground">2.</div>
              <div>
                <h3 className="text-foreground font-medium">
                  Automated checks
                </h3>
                <p className="text-muted-foreground text-sm">
                  Our distributed system continuously checks your services from
                  multiple regions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="text-foreground">3.</div>
              <div>
                <h3 className="text-foreground text-lg font-medium">
                  Instant alerts
                </h3>
                <p className="text-muted-foreground text-sm">
                  Get notified via email, Slack, or webhooks when issues are
                  detected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="space-y-6">
          <h2
            id="pricing"
            className="text-foreground w-fit bg-stone-50 text-xl font-medium underline underline-offset-4"
          >
            Pricing
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="bg-stone-50 p-6">
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-medium">Hobby</h3>
                    <p className="text-foreground text-xs">
                      Perfect for personal projects
                    </p>
                  </div>
                  <div>
                    <div className="text-foreground font-mono text-2xl">$0</div>
                    <div className="text-muted-foreground text-xs">
                      per month
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monitors</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check frequency</span>
                      <span className="font-medium">5 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regions</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team members</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status pages</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notifications</span>
                      <span className="font-medium">Email, Slack</span>
                    </div>
                  </div>
                </div>
                <Button className="mt-6 w-full" variant="outline">
                  Get Started Free
                </Button>
              </div>
            </Card>

            <Card className="border-2 border-stone-950 bg-stone-50 p-6 ring-2 ring-stone-200">
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-primary mb-2 text-xs font-medium">
                      MOST POPULAR
                    </div>
                    <h3 className="font-medium">Pro</h3>
                    <p className="text-foreground text-xs">
                      Great for growing teams
                    </p>
                  </div>
                  <div>
                    <div className="text-foreground font-mono text-2xl">
                      $15
                    </div>
                    <div className="text-muted-foreground text-xs">
                      per month
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monitors</span>
                      <span className="font-medium">25</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check frequency</span>
                      <span className="font-medium">1 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regions</span>
                      <span className="font-medium">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team members</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status pages</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notifications</span>
                      <span className="font-medium">All channels</span>
                    </div>
                  </div>
                </div>
                <Button className="mt-6 w-full">Start Pro Plan</Button>
              </div>
            </Card>

            <Card className="bg-stone-50 p-6">
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-medium">Business</h3>
                    <p className="text-foreground text-xs">
                      For growing businesses
                    </p>
                  </div>
                  <div>
                    <div className="text-foreground font-mono text-2xl">
                      $50
                    </div>
                    <div className="text-muted-foreground text-xs">
                      per month
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monitors</span>
                      <span className="font-medium">100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check frequency</span>
                      <span className="font-medium">30 sec</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regions</span>
                      <span className="font-medium">All</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team members</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status pages</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notifications</span>
                      <span className="font-medium">All channels</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority support</span>
                      <span className="font-medium">✓</span>
                    </div>
                  </div>
                </div>
                <Button className="mt-6 w-full" variant="outline">
                  Start Business Plan
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="space-y-6">
          <h2 className="text-foreground w-fit bg-stone-50 text-xl font-medium underline underline-offset-4 dark:bg-stone-800">
            Frequently asked questions
          </h2>
          <div className="max-w-2xl space-y-6">
            <div className="flex items-start space-x-2">
              <div>
                <h3 className="text-foreground font-medium">
                  What monitoring regions does Shamva support?
                </h3>
                <p className="text-muted-foreground text-sm">
                  ⎿ We monitor from multiple global regions including North
                  America, Europe, Asia, and more to ensure your services are
                  accessible worldwide.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-foreground font-medium">
                Which notification channels does Shamva support?
              </h3>
              <p className="text-muted-foreground text-sm">
                ⎿ You can get notified via email, Slack, Discord, PagerDuty,
                SMS, WhatsApp, and GitHub. Email notifications are included for
                all workspace members.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-medium">
                What types of monitors can I create?
              </h3>
              <p className="text-muted-foreground text-sm">
                ⎿ HTTP monitors (GET, POST, HEAD), TCP monitors, and heartbeats.
                You can configure custom headers, request bodies, check
                intervals from 1 minute to 1 hour, and set up heartbeat
                monitoring for your applications.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-medium">
                Is Shamva free to use?
              </h3>
              <p className="text-muted-foreground text-sm">
                ⎿ It's open source and will have pricing plans. You can
                self-host it for free or use the hosted service when pricing is
                announced.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16">
        <div className="space-y-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div>
                <span
                  className="text-3xl font-medium tracking-wide"
                  style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                >
                  Shamva
                </span>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm">
                Simple monitoring for modern teams. Open source and built for
                scale.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-foreground font-medium">Product</h4>
              <div className="space-y-2 text-sm">
                <Link
                  to="/auth/log-in"
                  className="text-muted-foreground hover:text-foreground block"
                >
                  Sign In
                </Link>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground block"
                >
                  Documentation
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground block"
                >
                  API Reference
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-foreground font-medium">Comparisons</h4>
              <div className="space-y-2 text-sm">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground block"
                >
                  Shamva vs UptimeRobot
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground block"
                >
                  Shamva vs Better Stack
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground block"
                >
                  Shamva vs Pingdom
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
