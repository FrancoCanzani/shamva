import { render } from "@react-email/render";
import { MonitorEmailData } from "../../lib/types";
import { calculateDowntime } from "../../lib/utils";
import { MonitorDownEmail } from "./templates/monitor-down-email";
import { MonitorRecoveredEmail } from "./templates/monitor-recovered-email";
import { Resend } from "resend";

export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(env: { RESEND_API_KEY: string }) {
    this.resend = new Resend(env.RESEND_API_KEY);
    this.fromEmail = "alerts@shamva.io";
  }

  async sendMonitorDownAlert(
    data: MonitorEmailData,
    userEmails: string[]
  ): Promise<boolean> {
    try {
      const emailHtml = await render(
        MonitorDownEmail({
          monitorName: data.monitorName,
          url: data.url,
          statusCode: data.statusCode,
          errorMessage: data.errorMessage,
          lastChecked: data.lastChecked,
          region: data.region,
          dashboardUrl: `https://shamva.io/dashboard/monitors/${data.monitorId}`,
        })
      );

      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmails,
        subject: `🚨 ${data.monitorName} is down`,
        html: emailHtml,
      });
      return true;
    } catch (error) {
      console.error("Failed to send monitor down alert:", error);
      return false;
    }
  }

  async sendMonitorRecoveredAlert(
    data: MonitorEmailData,
    lastSuccessAt: string,
    userEmails: string[]
  ): Promise<boolean> {
    try {
      const downtime = calculateDowntime(lastSuccessAt, new Date());
      const emailHtml = await render(
        MonitorRecoveredEmail({
          monitorName: data.monitorName,
          url: data.url,
          downtime,
          lastChecked: data.lastChecked,
          region: data.region,
          dashboardUrl: `https://shamva.io/dashboard/monitors/${data.monitorId}`,
        })
      );

      await this.resend.emails.send({
        from: this.fromEmail,
        to: userEmails,
        subject: `✅ ${data.monitorName} is back up`,
        html: emailHtml,
      });
      return true;
    } catch (error) {
      console.error("Failed to send monitor recovered alert:", error);
      return false;
    }
  }

  async sendTestEmail(userEmail: string): Promise<boolean> {
    try {
      const testData: MonitorEmailData = {
        monitorId: "test-123",
        monitorName: "Test Monitor",
        url: "https://example.com",
        statusCode: 500,
        errorMessage: "Internal Server Error",
        lastChecked: new Date().toISOString(),
        region: "us-east-1",
      };

      return await this.sendMonitorDownAlert(testData, [userEmail]);
    } catch (error) {
      console.error("Failed to send test email:", error);
      return false;
    }
  }
}
