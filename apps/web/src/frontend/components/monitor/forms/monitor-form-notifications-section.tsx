import { cn } from "@/frontend/lib/utils";
import { useFormContext } from "react-hook-form";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Link } from "@tanstack/react-router";

const FormField = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("space-y-2", className)}>{children}</div>;

const ErrorMessage = ({ errors }: { errors?: string }) =>
  errors ? <p className="text-sm text-destructive">{errors}</p> : null;

export function MonitorFormNotificationsSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div id="notifications" className="space-y-4">
      <h3 className="text-sm font-medium">Notifications</h3>
      <p className="text-xs text-muted-foreground">
        * Every accepted user in your workspace will receive email
        notifications. Additionally, you can configure Slack notifications.
      </p>
      <FormField>
        <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
        <Input
          id="slackWebhookUrl"
          {...register("slackWebhookUrl")}
          placeholder="https://hooks.slack.com/services/..."
        />
        <ErrorMessage errors={errors.slackWebhookUrl?.message?.toString()} />
        <p className="text-xs text-muted-foreground">
          Optional. Add a{" "}
          <Link
            className="underline font-medium text-primary"
            to="/dashboard/$workspaceName/monitors"
            params={{ workspaceName: "workspaceName" }}
          >
            Slack webhook URL
          </Link>{" "}
          to receive notifications in your Slack channel.
        </p>
      </FormField>
    </div>
  );
}
