import { MonitorEmailData } from "../../lib/types";
import { calculateDowntime } from "../../lib/utils";

export class SlackService {
  constructor() {}

  private async sendMessage(
    webhookUrl: string,
    message: string
  ): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) {
        throw new Error(`Slack API responded with status ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
      return false;
    }
  }

  async sendMonitorDownAlert(
    data: MonitorEmailData,
    webhookUrl: string
  ): Promise<boolean> {
    const message =
      `🚨 *Monitor Alert: ${data.monitorName} is Down*\n\n` +
      `• URL: ${data.url}\n` +
      `• Status: ${data.statusCode ? `HTTP ${data.statusCode}` : "Connection Failed"}\n` +
      `• Error: ${data.errorMessage}\n` +
      `• Last Checked: ${new Date(data.lastChecked).toLocaleString()}\n` +
      (data.region ? `• Region: ${data.region}\n` : "") +
      `\nWe'll continue monitoring and notify you when the service is restored.`;

    return this.sendMessage(webhookUrl, message);
  }

  async sendMonitorRecoveredAlert(
    data: MonitorEmailData,
    lastSuccessAt: string,
    webhookUrl: string
  ): Promise<boolean> {
    const downtime = calculateDowntime(lastSuccessAt, new Date());
    const message =
      `✅ *Great News: ${data.monitorName} is Back Online*\n\n` +
      `• URL: ${data.url}\n` +
      `• Status: Online\n` +
      `• Downtime: ${downtime}\n` +
      `• Recovered At: ${new Date(data.lastChecked).toLocaleString()}\n` +
      (data.region ? `• Region: ${data.region}\n` : "") +
      `\nWe'll continue monitoring to ensure your service stays healthy.`;

    return this.sendMessage(webhookUrl, message);
  }
}
