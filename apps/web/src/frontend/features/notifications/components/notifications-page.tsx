import DashboardHeader from "@/frontend/components/dashboard-header";
import { Card } from "@/frontend/components/ui/card";
import { useLoaderData, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Notification, NotificationIntegration, Notifications } from "../types";
import { NotificationSheet } from "./notification-sheet";

const integrations: NotificationIntegration[] = [
  {
    id: "email",
    name: "Email",
    description: "Receive notifications via email.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/gmail.svg",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send alerts to your Slack channel.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/slack.svg",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Receive notifications in your Discord server.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/discord.svg",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    description: "Integrate with PagerDuty.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/pagerduty.svg",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Create GitHub issues automatically.",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github.svg",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
];

export default function NotificationsPage() {
  const config = useLoaderData({
    from: "/dashboard/$workspaceName/notifications/",
  }) as Notifications;
  const { workspaceName } = useParams({
    from: "/dashboard/$workspaceName/notifications/",
  });
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getNotificationStatus = (notificationType: Notification) => {
    if (!config) return "available";

    switch (notificationType) {
      case "email":
        return config.email_enabled && "connected";
      case "slack":
        return config.slack_enabled && "connected";
      case "discord":
        return config.discord_enabled && "connected";
      case "pagerduty":
        return config.pagerduty_enabled && "connected";
      case "github":
        return config.github_enabled && "connected";
    }
  };

  const handleCardClick = (notificationType: Notification) => {
    setSelectedNotification(notificationType);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedNotification(null);
  };

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Notifications" />

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
          {integrations.map((integration) => {
            const status = getNotificationStatus(integration.id);
            return (
              <Card
                key={integration.id}
                className="cursor-pointer space-y-1.5 rounded-md p-2.5 hover:bg-stone-50 dark:hover:bg-stone-50/10"
                onClick={() => handleCardClick(integration.id)}
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={integration.icon}
                      alt={integration.name}
                      className="h-3.5 w-3.5 dark:grayscale"
                    />
                    <h4 className="font-medium">{integration.name}</h4>
                  </div>
                  {status && (
                    <span className="rounded border px-1 py-0.5 font-mono text-xs capitalize">
                      {status}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {integration.description}
                  </p>
                </div>
              </Card>
            );
          })}
          <Card className="text-muted-foreground flex items-center justify-center space-y-1 rounded-md border border-dashed bg-stone-50/10 p-2.5 text-sm ring-0">
            More integrations coming soon
          </Card>
        </div>
      </main>

      {config && (
        <NotificationSheet
          isOpen={isSheetOpen}
          onClose={handleSheetClose}
          notificationType={selectedNotification}
          config={config}
          workspaceName={workspaceName}
        />
      )}
    </div>
  );
}
