import { MonitorEmailData } from "../lib/types";
import { calculateDowntime } from "../lib/utils";
import { EmailService } from "./email/service";
import { SlackService } from "./slack/service";
import { PagerDutyService } from "./pagerduty/service";
import { DiscordService } from "./discord/service";
import { SMSService } from "./sms/service";
import { WhatsAppService } from "./whatsapp/service";
import { GitHubService } from "./github/service";

export interface NotificationConfig {
  // Email
  userEmails: string[];

  // Slack
  slackWebhookUrl?: string;

  // PagerDuty
  pagerDutyServiceId?: string;
  pagerDutyApiKey?: string;

  // Discord
  discordWebhookUrl?: string;

  // SMS
  smsPhoneNumbers?: string[];
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;

  // WhatsApp
  whatsappPhoneNumbers?: string[];

  // GitHub
  githubIssueTracking?: boolean;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
}

export class NotificationService {
  private emailService: EmailService;
  private slackService: SlackService;
  private pagerDutyService?: PagerDutyService;
  private discordService: DiscordService;
  private smsService?: SMSService;
  private whatsappService?: WhatsAppService;
  private githubService?: GitHubService;

  constructor(config: NotificationConfig, env: { RESEND_API_KEY: string }) {
    this.emailService = new EmailService(env);
    this.slackService = new SlackService();
    this.discordService = new DiscordService();

    if (config.pagerDutyApiKey) {
      this.pagerDutyService = new PagerDutyService(config.pagerDutyApiKey);
    }

    if (
      config.twilioAccountSid &&
      config.twilioAuthToken &&
      config.twilioFromNumber
    ) {
      this.smsService = new SMSService(
        config.twilioAccountSid,
        config.twilioAuthToken,
        config.twilioFromNumber
      );
      this.whatsappService = new WhatsAppService(
        config.twilioAccountSid,
        config.twilioAuthToken,
        config.twilioFromNumber
      );
    }

    if (config.githubToken && config.githubOwner && config.githubRepo) {
      this.githubService = new GitHubService(
        config.githubToken,
        config.githubOwner,
        config.githubRepo
      );
    }
  }

  async sendMonitorDownAlert(
    data: MonitorEmailData,
    config: NotificationConfig
  ): Promise<{ [key: string]: boolean | string | null }> {
    const results: { [key: string]: boolean | string | null } = {};

    // Email notifications
    if (config.userEmails && config.userEmails.length > 0) {
      results.email = await this.emailService.sendMonitorDownAlert(
        data,
        config.userEmails
      );
    }

    // Slack notifications
    if (config.slackWebhookUrl) {
      results.slack = await this.slackService.sendMonitorDownAlert(
        data,
        config.slackWebhookUrl
      );
    }

    // PagerDuty notifications
    if (this.pagerDutyService && config.pagerDutyServiceId) {
      const title = `🚨 Monitor Alert: ${data.monitorName} is Down`;
      const description =
        `**Monitor Alert: ${data.monitorName} is Down**\n\n` +
        `• URL: ${data.url}\n` +
        `• Status: ${data.statusCode ? `HTTP ${data.statusCode}` : "Connection Failed"}\n` +
        `• Error: ${data.errorMessage}\n` +
        `• Last Checked: ${new Date(data.lastChecked).toLocaleString()}\n` +
        (data.region ? `• Region: ${data.region}\n` : "") +
        `\nWe'll continue monitoring and notify you when the service is restored.`;

      results.pagerduty = await this.pagerDutyService.createIncident(
        config.pagerDutyServiceId,
        title,
        description,
        "critical"
      );
    }

    // Discord notifications
    if (config.discordWebhookUrl) {
      const embed = {
        title: "🚨 Monitor Alert: Service is Down",
        description: `${data.monitorName} is currently experiencing issues.`,
        color: 0xff0000, // Red
        fields: [
          {
            name: "URL",
            value: data.url,
            inline: false,
          },
          {
            name: "Status",
            value: data.statusCode
              ? `HTTP ${data.statusCode}`
              : "Connection Failed",
            inline: true,
          },
          {
            name: "Error",
            value: data.errorMessage || "Unknown error",
            inline: true,
          },
          {
            name: "Last Checked",
            value: new Date(data.lastChecked).toLocaleString(),
            inline: true,
          },
          ...(data.region
            ? [
                {
                  name: "Region",
                  value: data.region,
                  inline: true,
                },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
      };

      results.discord = await this.discordService.sendMessage(
        config.discordWebhookUrl,
        embed
      );
    }

    // SMS notifications
    if (
      this.smsService &&
      config.smsPhoneNumbers &&
      config.smsPhoneNumbers.length > 0
    ) {
      const message =
        `🚨 SHAMVA ALERT: ${data.monitorName} is DOWN\n\n` +
        `URL: ${data.url}\n` +
        `Status: ${data.statusCode ? `HTTP ${data.statusCode}` : "Connection Failed"}\n` +
        `Error: ${data.errorMessage}\n` +
        `Region: ${data.region}\n` +
        `Time: ${new Date(data.lastChecked).toLocaleString()}\n\n` +
        `We'll notify you when it's back online.`;

      const smsResults = await Promise.all(
        config.smsPhoneNumbers.map((phoneNumber) =>
          this.smsService!.sendSMS(phoneNumber, message)
        )
      );
      results.sms = smsResults.some((success) => success);
    }

    // WhatsApp notifications
    if (
      this.whatsappService &&
      config.whatsappPhoneNumbers &&
      config.whatsappPhoneNumbers.length > 0
    ) {
      const message =
        `🚨 *SHAMVA ALERT: ${data.monitorName} is DOWN*\n\n` +
        `*URL:* ${data.url}\n` +
        `*Status:* ${data.statusCode ? `HTTP ${data.statusCode}` : "Connection Failed"}\n` +
        `*Error:* ${data.errorMessage}\n` +
        `*Region:* ${data.region}\n` +
        `*Time:* ${new Date(data.lastChecked).toLocaleString()}\n\n` +
        `We'll notify you when it's back online.`;

      const whatsappResults = await Promise.all(
        config.whatsappPhoneNumbers.map((phoneNumber) =>
          this.whatsappService!.sendWhatsAppMessage(phoneNumber, message)
        )
      );
      results.whatsapp = whatsappResults.some((success) => success);
    }

    // GitHub notifications
    if (this.githubService && config.githubIssueTracking) {
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

      results.github = await this.githubService.createIssue(title, body, [
        "urgent",
        "down",
      ]);
    }

    return results;
  }

  async sendMonitorRecoveredAlert(
    data: MonitorEmailData,
    lastSuccessAt: string,
    config: NotificationConfig,
    previousResults?: { [key: string]: boolean | string | null }
  ): Promise<{ [key: string]: boolean | string | null }> {
    const results: { [key: string]: boolean | string | null } = {};
    const downtime = calculateDowntime(lastSuccessAt, new Date());

    // Email notifications
    if (config.userEmails && config.userEmails.length > 0) {
      results.email = await this.emailService.sendMonitorRecoveredAlert(
        data,
        lastSuccessAt,
        config.userEmails
      );
    }

    // Slack notifications
    if (config.slackWebhookUrl) {
      results.slack = await this.slackService.sendMonitorRecoveredAlert(
        data,
        lastSuccessAt,
        config.slackWebhookUrl
      );
    }

    // PagerDuty notifications
    if (this.pagerDutyService && config.pagerDutyServiceId) {
      if (
        previousResults?.pagerduty &&
        typeof previousResults.pagerduty === "string"
      ) {
        // Extract incident ID from the previous result and resolve it
        const incidentId = previousResults.pagerduty;
        results.pagerduty =
          await this.pagerDutyService.resolveIncident(incidentId);
      } else {
        // Create a new resolution notification
        const title = `✅ Monitor Recovered: ${data.monitorName} is Back Online`;
        const description =
          `**Great News: ${data.monitorName} is Back Online**\n\n` +
          `• URL: ${data.url}\n` +
          `• Status: Online\n` +
          `• Downtime: ${downtime}\n` +
          `• Recovered At: ${new Date(data.lastChecked).toLocaleString()}\n` +
          (data.region ? `• Region: ${data.region}\n` : "") +
          `\nWe'll continue monitoring to ensure your service stays healthy.`;

        results.pagerduty = await this.pagerDutyService.createIncident(
          config.pagerDutyServiceId,
          title,
          description,
          "info"
        );
      }
    }

    // Discord notifications
    if (config.discordWebhookUrl) {
      const embed = {
        title: "✅ Monitor Recovered: Service is Back Online",
        description: `${data.monitorName} has recovered and is now operational.`,
        color: 0x00ff00, // Green
        fields: [
          {
            name: "URL",
            value: data.url,
            inline: false,
          },
          {
            name: "Status",
            value: "Online",
            inline: true,
          },
          {
            name: "Downtime",
            value: downtime,
            inline: true,
          },
          {
            name: "Recovered At",
            value: new Date(data.lastChecked).toLocaleString(),
            inline: true,
          },
          ...(data.region
            ? [
                {
                  name: "Region",
                  value: data.region,
                  inline: true,
                },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
      };

      results.discord = await this.discordService.sendMessage(
        config.discordWebhookUrl,
        embed
      );
    }

    // SMS notifications
    if (
      this.smsService &&
      config.smsPhoneNumbers &&
      config.smsPhoneNumbers.length > 0
    ) {
      const message =
        `✅ SHAMVA RECOVERY: ${data.monitorName} is BACK ONLINE\n\n` +
        `URL: ${data.url}\n` +
        `Status: Online\n` +
        `Downtime: ${downtime}\n` +
        `Recovered: ${new Date(data.lastChecked).toLocaleString()}\n` +
        `Region: ${data.region}`;

      const smsResults = await Promise.all(
        config.smsPhoneNumbers.map((phoneNumber) =>
          this.smsService!.sendSMS(phoneNumber, message)
        )
      );
      results.sms = smsResults.some((success) => success);
    }

    // WhatsApp notifications
    if (
      this.whatsappService &&
      config.whatsappPhoneNumbers &&
      config.whatsappPhoneNumbers.length > 0
    ) {
      const message =
        `✅ *SHAMVA RECOVERY: ${data.monitorName} is BACK ONLINE*\n\n` +
        `*URL:* ${data.url}\n` +
        `*Status:* Online\n` +
        `*Downtime:* ${downtime}\n` +
        `*Recovered:* ${new Date(data.lastChecked).toLocaleString()}\n` +
        `*Region:* ${data.region}`;

      const whatsappResults = await Promise.all(
        config.whatsappPhoneNumbers.map((phoneNumber) =>
          this.whatsappService!.sendWhatsAppMessage(phoneNumber, message)
        )
      );
      results.whatsapp = whatsappResults.some((success) => success);
    }

    // GitHub notifications
    if (this.githubService && config.githubIssueTracking) {
      if (
        previousResults?.github &&
        typeof previousResults.github === "string"
      ) {
        // Extract issue number from the previous result and close it
        const issueUrl = previousResults.github;
        const issueNumberMatch = issueUrl.match(/\/(\d+)$/);
        if (issueNumberMatch) {
          const issueNumber = parseInt(issueNumberMatch[1], 10);
          results.github = await this.githubService.closeIssue(issueNumber);
        }
      } else {
        // Create a recovery notification issue
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

        results.github = await this.githubService.createIssue(title, body, [
          "resolved",
          "recovery",
        ]);
      }
    }

    return results;
  }
}
