import DashboardHeader from "@/frontend/components/dashboard-header";
import { Card } from "@/frontend/components/ui/card";
import { Link } from "@tanstack/react-router";

interface NotificationIntegration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "available";
  color: string;
  bgColor: string;
}

const integrations: NotificationIntegration[] = [
  {
    id: "email",
    name: "Email",
    description: "Receive notifications via email.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/gmail.svg",
    status: "connected",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send alerts to your Slack channel.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/slack.svg",
    status: "available",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Receive notifications in your Discord server.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/discord.svg",
    status: "available",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    description: "Integrate with PagerDuty.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/pagerduty.svg",
    status: "available",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Create GitHub issues automatically.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github.svg",
    status: "available",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
];

export default function NotificationsPage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 overflow-auto p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">Notifications</h2>
            <p className="text-muted-foreground mt-1 hidden text-sm md:block">
              Configure your notification channels.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {integrations.map((integration) => (
            <Link>
              <Card className="hover:bg-carbon-50/10 space-y-1 p-2.5">
                <div className="flex flex-row items-center justify-start gap-1.5">
                  {
                    <img
                      src={integration.icon}
                      alt={integration.name}
                      className="h-4 w-4"
                    />
                  }
                  <h4 className="font-medium">{integration.name}</h4>
                </div>
                <div className="inline-flex w-full justify-between">
                  <p className="text-muted-foreground text-sm">
                    {integration.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
          <Card className="bg-carbon-50/10 text-muted-foreground flex items-center justify-center space-y-1 border border-dashed p-2.5 text-sm ring-0">
            More integrations coming soon
          </Card>
        </div>
      </main>
    </div>
  );
}
