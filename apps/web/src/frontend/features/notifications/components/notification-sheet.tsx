import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/frontend/components/ui/sheet";
import { useIsMobile } from "@/frontend/hooks/use-mobile";
import { toast } from "sonner";
import { useUpdateWorkspaceNotifications } from "../api/mutations";
import { Notification, Notifications } from "../types";
import { DiscordForm } from "./forms/discord-form";
import { EmailForm } from "./forms/email-form";
import { GitHubForm } from "./forms/github-form";
import { PagerDutyForm } from "./forms/pagerduty-form";
import { SlackForm } from "./forms/slack-form";

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notificationType: Notification | null;
  config: Notifications;
  workspaceName: string;
}

const notificationConfig = {
  email: {
    title: "Email Notifications",
    description: "Configure email notifications for workspace members",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/gmail.svg",
  },
  slack: {
    title: "Slack Integration",
    description: "Send alerts to your Slack workspace",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/slack.svg",
  },
  discord: {
    title: "Discord Integration",
    description: "Send alerts to your Discord server",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/discord.svg",
  },
  pagerduty: {
    title: "PagerDuty Integration",
    description: "Create and manage incidents in PagerDuty",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/pagerduty.svg",
  },
  github: {
    title: "GitHub Integration",
    description: "Automatically create GitHub issues for incidents",
    icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github.svg",
  },
  sms: {
    title: "SMS Notifications",
    description: "Send text message alerts via Twilio",
    icon: "📱",
  },
  whatsapp: {
    title: "WhatsApp Notifications",
    description: "Send WhatsApp messages via Twilio",
    icon: "📲",
  },
};

export function NotificationSheet({
  isOpen,
  onClose,
  notificationType,
  config,
  workspaceName,
}: NotificationSheetProps) {
  const updateMutation = useUpdateWorkspaceNotifications(workspaceName);
  const isMobile = useIsMobile();

  const handleSave = async (updates: Partial<Notifications>) => {
    try {
      await updateMutation.mutateAsync(updates);
      toast.success("Notification configuration updated successfully");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update configuration"
      );
    }
  };

  const renderForm = () => {
    if (!notificationType) return null;

    const commonProps = {
      config,
      onSave: handleSave,
      isLoading: updateMutation.isPending,
    };

    switch (notificationType) {
      case "email":
        return <EmailForm {...commonProps} />;
      case "slack":
        return <SlackForm {...commonProps} />;
      case "discord":
        return <DiscordForm {...commonProps} />;
      case "pagerduty":
        return <PagerDutyForm {...commonProps} />;
      case "github":
        return <GitHubForm {...commonProps} />;
      case "sms":
        return (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              SMS notifications coming soon...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const currentConfig = notificationType
    ? notificationConfig[notificationType]
    : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="w-full md:max-w-md"
        side={isMobile ? "bottom" : "right"}
      >
        {currentConfig && (
          <SheetHeader>
            <div className="flex items-center gap-2">
              <img
                src={currentConfig.icon}
                alt={currentConfig.title}
                className="h-4 w-4"
              />

              <SheetTitle className="font-medium">
                {currentConfig.title}
              </SheetTitle>
            </div>
            <SheetDescription>{currentConfig.description}</SheetDescription>
          </SheetHeader>
        )}

        <div className="flex-1 px-4 pb-4">{renderForm()}</div>
      </SheetContent>
    </Sheet>
  );
}
