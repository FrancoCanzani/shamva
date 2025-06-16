import { MonitorEmailData } from "../types";

export class SlackService {
  constructor() {}

  private calculateDowntime(
    lastSuccessAt: string,
    currentTime: Date,
  ): string {
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

  private async sendMessage(webhookUrl: string, message: string): Promise<boolean> {
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

  async sendMonitorDownAlert(data: MonitorEmailData, webhookUrl: string): Promise<boolean> {
    const message = `🚨 *Monitor Alert: ${data.monitorName} is Down*\n\n` +
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
    webhookUrl: string,
  ): Promise<boolean> {
    const downtime = this.calculateDowntime(lastSuccessAt, new Date());
    const message = `✅ *Great News: ${data.monitorName} is Back Online*\n\n` +
      `• URL: ${data.url}\n` +
      `• Status: Online\n` +
      `• Downtime: ${downtime}\n` +
      `• Recovered At: ${new Date(data.lastChecked).toLocaleString()}\n` +
      (data.region ? `• Region: ${data.region}\n` : "") +
      `\nWe'll continue monitoring to ensure your service stays healthy.`;

    return this.sendMessage(webhookUrl, message);
  }
} 