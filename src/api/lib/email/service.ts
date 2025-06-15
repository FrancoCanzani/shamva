import { render } from "@react-email/render";
import { EnvBindings } from "../../../../bindings";
import { MonitorEmailData } from "../types";
import { createResendClient } from "./client";
import { MonitorDownEmail } from "./templates/monitor-down-email";
import { MonitorRecoveredEmail } from "./templates/monitor-recovered-email";

export class EmailService {
  private resend;
  private fromEmail: string;

  constructor(env: EnvBindings) {
    this.resend = createResendClient(env);
    this.fromEmail = "alerts@shamva.io";
  }

  private calculateDowntime(
    lastSuccessAt: string | null,
    currentTime: Date,
  ): string {
    if (!lastSuccessAt) return "Unknown";

    const lastSuccess = new Date(lastSuccessAt);
    const diffMs = currentTime.getTime() - lastSuccess.getTime();

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }

  async sendMonitorDownAlert(data: MonitorEmailData): Promise<boolean> {
    try {
      const emailHtml = await render(
        MonitorDownEmail({
          monitorName: data.monitorName,
          url: data.url,
          userName: data.userName,
          statusCode: data.statusCode,
          errorMessage: data.errorMessage,
          lastChecked: data.lastChecked,
          region: data.region,
        }),
      );

      const emailText = await render(
        MonitorDownEmail({
          monitorName: data.monitorName,
          url: data.url,
          userName: data.userName,
          statusCode: data.statusCode,
          errorMessage: data.errorMessage,
          lastChecked: data.lastChecked,
          region: data.region,
        }),
        { plainText: true },
      );

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [data.userEmail],
        subject: `🚨 Monitor Alert: ${data.monitorName} is Down`,
        html: emailHtml,
        text: emailText,
      });

      console.log(`Monitor down email sent successfully: ${result.data?.id}`);
      return true;
    } catch (error) {
      console.error("Failed to send monitor down email:", error);
      return false;
    }
  }

  async sendMonitorRecoveredAlert(
    data: MonitorEmailData,
    lastSuccessAt: string | null,
  ): Promise<boolean> {
    try {
      const downtime = this.calculateDowntime(
        lastSuccessAt,
        new Date(data.lastChecked),
      );

      const emailHtml = await render(
        MonitorRecoveredEmail({
          monitorName: data.monitorName,
          url: data.url,
          userName: data.userName,
          downtime,
          lastChecked: data.lastChecked,
          region: data.region,
        }),
      );

      const emailText = await render(
        MonitorRecoveredEmail({
          monitorName: data.monitorName,
          url: data.url,
          userName: data.userName,
          downtime,
          lastChecked: data.lastChecked,
          region: data.region,
        }),
        { plainText: true },
      );

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [data.userEmail],
        subject: `✅ Good News: ${data.monitorName} is Back Online`,
        html: emailHtml,
        text: emailText,
      });

      console.log(
        `Monitor recovered email sent successfully: ${result.data?.id}`,
      );
      return true;
    } catch (error) {
      console.error("Failed to send monitor recovered email:", error);
      return false;
    }
  }

  async sendTestEmail(userEmail: string): Promise<boolean> {
    try {
      const testData: MonitorEmailData = {
        monitorId: "test-123",
        monitorName: "Test Monitor",
        url: "https://example.com",
        userEmail,
        userName: "Test User",
        statusCode: 500,
        errorMessage: "Internal Server Error",
        lastChecked: new Date().toISOString(),
        region: "us-east-1",
      };

      return await this.sendMonitorDownAlert(testData);
    } catch (error) {
      console.error("Failed to send test email:", error);
      return false;
    }
  }
}
