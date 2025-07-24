import DashboardHeader from "@/frontend/components/dashboard-header";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import {
  AlertTriangle,
  Bell,
  Github,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";

interface NotificationIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "connected" | "available";
  color: string;
  bgColor: string;
}

const NOTIFICATION_INTEGRATIONS: NotificationIntegration[] = [
  {
    id: "email",
    name: "Email",
    description:
      "Receive notifications via email when monitors go down or recover.",
    icon: Mail,
    status: "connected",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send alerts to your Slack channels when incidents occur.",
    icon: MessageSquare,
    status: "available",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Receive notifications in your Discord server via webhooks.",
    icon: MessageSquare,
    status: "available",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    description:
      "Integrate with PagerDuty for incident management and escalation.",
    icon: AlertTriangle,
    status: "available",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "sms",
    name: "SMS",
    description: "Get instant SMS notifications for critical incidents.",
    icon: Phone,
    status: "available",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Receive WhatsApp messages for monitor status updates.",
    icon: MessageSquare,
    status: "available",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Create GitHub issues automatically when incidents occur.",
    icon: Github,
    status: "available",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
];

export default function NotificationsPage() {
  const activeIntegrations = NOTIFICATION_INTEGRATIONS.filter(
    (integration) => integration.status === "connected"
  );
  const availableIntegrations = NOTIFICATION_INTEGRATIONS.filter(
    (integration) => integration.status === "available"
  );

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Notifications</h1>
        </div>
      </DashboardHeader>

      <main className="flex-1 space-y-8 overflow-auto p-6">
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Active Integrations</h2>
            <p className="text-muted-foreground text-sm">
              Everything connected to your workspace
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeIntegrations.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${integration.bgColor}`}
                      >
                        <integration.icon
                          className={`h-5 w-5 ${integration.color}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {integration.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {integration.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                    <Button variant="link" size="sm" className="text-xs">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Integrations</h2>
            <p className="text-muted-foreground text-sm">
              Everything connected to your workspace
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableIntegrations.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${integration.bgColor}`}
                    >
                      <integration.icon
                        className={`h-5 w-5 ${integration.color}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {integration.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {integration.description}
                  </CardDescription>
                  <div className="mt-4">
                    <Button variant="link" size="sm" className="p-0 text-xs">
                      Connect →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
