import { MonitorEmailData } from "../../lib/types";

export class GitHubService {
  private token: string;
  private owner: string;
  private repo: string;
  private baseUrl = "https://api.github.com";

  constructor(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  private calculateDowntime(lastSuccessAt: string, currentTime: Date): string {
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

  async createIssue(
    title: string,
    body: string,
    labels: string[] = []
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${this.token}`,
            "User-Agent": "Shamva-Monitoring/1.0",
          },
          body: JSON.stringify({
            title,
            body,
            labels: ["monitoring", "incident", ...labels],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json() as { number: number; html_url: string };
      return data.html_url;
    } catch (error) {
      console.error("Failed to create GitHub issue:", error);
      return null;
    }
  }

  async closeIssue(issueNumber: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${this.token}`,
            "User-Agent": "Shamva-Monitoring/1.0",
          },
          body: JSON.stringify({
            state: "closed",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API responded with status ${response.status}: ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to close GitHub issue:", error);
      return false;
    }
  }

  async sendMonitorDownAlert(
    data: MonitorEmailData
  ): Promise<{ success: boolean; issueUrl?: string }> {
    const title = `🚨 Monitor Alert: ${data.monitorName} is Down`;
    const body =
      `## Monitor Alert: ${data.monitorName} is Down\n\n` +
      `**Service Details:**\n` +
      `- **Monitor Name:** ${data.monitorName}\n` +
      `- **URL:** ${data.url}\n` +
      `- **Status:** ${data.statusCode ? `HTTP ${data.statusCode}` : "Connection Failed"}\n` +
      `- **Error:** ${data.errorMessage}\n` +
      `- **Region:** ${data.region}\n` +
      `- **Last Checked:** ${new Date(data.lastChecked).toLocaleString()}\n\n` +
      `**Next Steps:**\n` +
      `- [ ] Investigate the issue\n` +
      `- [ ] Check server logs\n` +
      `- [ ] Verify configuration\n` +
      `- [ ] Update status when resolved\n\n` +
      `---\n` +
      `*This issue was automatically created by Shamva monitoring system.*`;

    const issueUrl = await this.createIssue(title, body, ["urgent", "down"]);
    
    return {
      success: issueUrl !== null,
      issueUrl: issueUrl || undefined,
    };
  }

  async sendMonitorRecoveredAlert(
    data: MonitorEmailData,
    lastSuccessAt: string,
    issueNumber?: number
  ): Promise<boolean> {
    const downtime = this.calculateDowntime(lastSuccessAt, new Date());
    
    // If we have an issue number, close it
    if (issueNumber) {
      return await this.closeIssue(issueNumber);
    }

    // Otherwise, create a recovery notification issue
    const title = `✅ Monitor Recovered: ${data.monitorName} is Back Online`;
    const body =
      `## Monitor Recovery: ${data.monitorName} is Back Online\n\n` +
      `**Recovery Details:**\n` +
      `- **Monitor Name:** ${data.monitorName}\n` +
      `- **URL:** ${data.url}\n` +
      `- **Status:** Online\n` +
      `- **Downtime Duration:** ${downtime}\n` +
      `- **Recovered At:** ${new Date(data.lastChecked).toLocaleString()}\n` +
      `- **Region:** ${data.region}\n\n` +
      `**Summary:**\n` +
      `The service has been restored and is now operational. We'll continue monitoring to ensure it stays healthy.\n\n` +
      `---\n` +
      `*This issue was automatically created by Shamva monitoring system.*`;

    const issueUrl = await this.createIssue(title, body, ["resolved", "recovery"]);
    return issueUrl !== null;
  }
} 