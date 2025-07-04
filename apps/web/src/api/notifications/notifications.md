# Shamva Notification Integrations

This document explains how to set up and configure the various notification integrations available in Shamva.

## Overview

Shamva supports multiple notification channels to alert you when your monitors go down or recover:

- **Email** - Send notifications via email (already implemented)
- **Slack** - Send messages to Slack channels (already implemented)
- **PagerDuty** - Create and manage incidents in PagerDuty
- **Discord** - Send rich embed messages to Discord channels
- **SMS** - Send text messages via Twilio
- **GitHub** - Create and close issues automatically

## 1. PagerDuty Integration

### What it does

- Creates incidents when monitors go down
- Resolves incidents when monitors recover
- Supports different urgency levels (critical, warning, error, info)

### Setup Instructions

1. **Create a PagerDuty Account**
   - Sign up at [pagerduty.com](https://www.pagerduty.com)
   - Create a new service for your monitoring alerts

2. **Get API Credentials**
   - Go to **Configuration** → **API Access Keys**
   - Create a new API key with the following permissions:
     - `incidents:write` - Create and update incidents
     - `services:read` - Read service information

3. **Get Service ID**
   - Go to **Configuration** → **Services**
   - Find your monitoring service and copy the Service ID

4. **Environment Variables**

   ```bash
   PAGERDUTY_API_KEY=your_api_key_here
   PAGERDUTY_SERVICE_ID=your_service_id_here
   PAGERDUTY_FROM_EMAIL=shamva-monitoring@yourdomain.com
   ```

5. **Update Monitor Configuration**
   - Add `pagerduty_service_id` field to your monitor configuration
   - The system will automatically create incidents when monitors fail

### Usage in Code

```typescript
import { PagerDutyService } from "./notifications/pagerduty/service";

const pagerDuty = new PagerDutyService(apiKey);
await pagerDuty.sendMonitorDownAlert(monitorData, serviceId);
await pagerDuty.sendMonitorRecoveredAlert(
  monitorData,
  lastSuccessAt,
  serviceId,
  incidentId
);
```

---

## 2. Discord Integration

### What it does

- Sends rich embed messages to Discord channels
- Uses color-coded embeds (red for down, green for recovery)
- Includes detailed monitor information in structured format

### Setup Instructions

1. **Create a Discord Webhook**
   - Go to your Discord server settings
   - Navigate to **Integrations** → **Webhooks**
   - Click **New Webhook**
   - Choose the channel where you want notifications
   - Copy the webhook URL

2. **Environment Variables**

   ```bash
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_url
   ```

3. **Update Monitor Configuration**
   - Add `discord_webhook_url` field to your monitor configuration
   - The system will automatically send Discord messages when monitors change status

### Usage in Code

```typescript
import { DiscordService } from "./notifications/discord/service";

const discord = new DiscordService();
await discord.sendMonitorDownAlert(monitorData, webhookUrl);
await discord.sendMonitorRecoveredAlert(monitorData, lastSuccessAt, webhookUrl);
```

---

## 3. SMS Integration (Twilio)

### What it does

- Sends SMS notifications to specified phone numbers
- Uses Twilio as the SMS provider
- Supports multiple phone numbers per alert

### Setup Instructions

1. **Create a Twilio Account**
   - Sign up at [twilio.com](https://www.twilio.com)
   - Verify your account and add payment method

2. **Get Twilio Credentials**
   - Go to **Console** → **Account Info**
   - Copy your **Account SID** and **Auth Token**
   - Get a **Twilio Phone Number** for sending SMS

3. **Environment Variables**

   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_FROM_NUMBER=+1234567890
   ```

4. **Update Monitor Configuration**
   - Add `sms_phone_numbers` array field to your monitor configuration
   - Include phone numbers in international format (e.g., `+1234567890`)

### Usage in Code

```typescript
import { SMSService } from "./notifications/sms/service";

const sms = new SMSService(accountSid, authToken, fromNumber);
await sms.sendMonitorDownAlert(monitorData, phoneNumbers);
await sms.sendMonitorRecoveredAlert(monitorData, lastSuccessAt, phoneNumbers);
```

---

## 4. GitHub Integration

### What it does

- Creates GitHub issues when monitors go down
- Automatically closes issues when monitors recover
- Adds appropriate labels and structured content
- Tracks incident lifecycle in your repository

### Setup Instructions

1. **Create a GitHub Personal Access Token**
   - Go to **GitHub Settings** → **Developer settings** → **Personal access tokens**
   - Click **Generate new token (classic)**
   - Select the following scopes:
     - `repo` - Full control of private repositories
     - `issues` - Create and manage issues

2. **Prepare Your Repository**
   - Ensure the repository exists and is accessible
   - The system will create issues in this repository

3. **Environment Variables**

   ```bash
   GITHUB_TOKEN=your_personal_access_token_here
   GITHUB_OWNER=your_github_username_or_org
   GITHUB_REPO=your_repository_name
   ```

4. **Update Monitor Configuration**
   - Add `github_issue_tracking` boolean field to your monitor configuration
   - When enabled, the system will create GitHub issues for incidents

### Usage in Code

```typescript
import { GitHubService } from "./notifications/github/service";

const github = new GitHubService(token, owner, repo);
const result = await github.sendMonitorDownAlert(monitorData);
// result.issueUrl contains the URL of the created issue
await github.sendMonitorRecoveredAlert(monitorData, lastSuccessAt, issueNumber);
```

---

## Database Schema Updates

To support these new notification integrations, you'll need to update your database schema:

```sql
-- Add new notification fields to monitors table
ALTER TABLE monitors ADD COLUMN pagerduty_service_id TEXT;
ALTER TABLE monitors ADD COLUMN discord_webhook_url TEXT;
ALTER TABLE monitors ADD COLUMN sms_phone_numbers TEXT[]; -- Array of phone numbers
ALTER TABLE monitors ADD COLUMN github_issue_tracking BOOLEAN DEFAULT FALSE;

-- Add notification tracking to incidents table
ALTER TABLE incidents ADD COLUMN pagerduty_incident_id TEXT;
ALTER TABLE incidents ADD COLUMN github_issue_url TEXT;
```

---

## Integration with Existing Code

To integrate these new notification services with your existing checker durable object, update the `sendNotifications` method:

```typescript
private async sendNotifications(
  emailData: MonitorEmailData,
  isRecovery: boolean,
  userEmails: string[],
  monitor: Monitor // Add monitor object to access new notification configs
): Promise<boolean> {
  if (this.env.NAME === "development") {
    return true;
  }

  try {
    const notificationPromises = [];

    // Email notifications
    notificationPromises.push(
      isRecovery
        ? this.emailService.sendMonitorRecoveredAlert(emailData, emailData.lastChecked, userEmails)
        : this.emailService.sendMonitorDownAlert(emailData, userEmails)
    );

    // Slack notifications
    if (monitor.slack_webhook_url) {
      notificationPromises.push(
        isRecovery
          ? this.slackService.sendMonitorRecoveredAlert(emailData, emailData.lastChecked, monitor.slack_webhook_url)
          : this.slackService.sendMonitorDownAlert(emailData, monitor.slack_webhook_url)
      );
    }

    // PagerDuty notifications
    if (monitor.pagerduty_service_id) {
      const pagerDuty = new PagerDutyService(this.env.PAGERDUTY_API_KEY);
      notificationPromises.push(
        isRecovery
          ? pagerDuty.sendMonitorRecoveredAlert(emailData, emailData.lastChecked, monitor.pagerduty_service_id)
          : pagerDuty.sendMonitorDownAlert(emailData, monitor.pagerduty_service_id)
      );
    }

    // Discord notifications
    if (monitor.discord_webhook_url) {
      const discord = new DiscordService();
      notificationPromises.push(
        isRecovery
          ? discord.sendMonitorRecoveredAlert(emailData, emailData.lastChecked, monitor.discord_webhook_url)
          : discord.sendMonitorDownAlert(emailData, monitor.discord_webhook_url)
      );
    }

    // SMS notifications
    if (monitor.sms_phone_numbers && monitor.sms_phone_numbers.length > 0) {
      const sms = new SMSService(
        this.env.TWILIO_ACCOUNT_SID,
        this.env.TWILIO_AUTH_TOKEN,
        this.env.TWILIO_FROM_NUMBER
      );
      notificationPromises.push(
        isRecovery
          ? sms.sendMonitorRecoveredAlert(emailData, emailData.lastChecked, monitor.sms_phone_numbers)
          : sms.sendMonitorDownAlert(emailData, monitor.sms_phone_numbers)
      );
    }

    // GitHub notifications
    if (monitor.github_issue_tracking) {
      const github = new GitHubService(
        this.env.GITHUB_TOKEN,
        this.env.GITHUB_OWNER,
        this.env.GITHUB_REPO
      );
      notificationPromises.push(
        isRecovery
          ? github.sendMonitorRecoveredAlert(emailData, emailData.lastChecked)
          : github.sendMonitorDownAlert(emailData)
      );
    }

    const results = await Promise.all(notificationPromises);
    return results.some((success) => success);
  } catch (error) {
    console.error(`DO ${this.doId}: Failed to send notification:`, error);
    return false;
  }
}
```

---

## Security Considerations

1. **API Keys**: Store all API keys as environment variables, never in code
2. **Webhook URLs**: Keep webhook URLs secure and rotate them periodically
3. **Phone Numbers**: Validate phone numbers before storing them
4. **Rate Limiting**: Implement rate limiting for notification services
5. **Error Handling**: Always handle API failures gracefully

---

## Testing

Each notification service includes error handling and logging. Test your integrations in development mode first:

```typescript
// Test PagerDuty
const pagerDuty = new PagerDutyService(apiKey);
await pagerDuty.sendMonitorDownAlert(testData, serviceId);

// Test Discord
const discord = new DiscordService();
await discord.sendMonitorDownAlert(testData, webhookUrl);

// Test SMS
const sms = new SMSService(accountSid, authToken, fromNumber);
await sms.sendMonitorDownAlert(testData, ["+1234567890"]);

// Test GitHub
const github = new GitHubService(token, owner, repo);
await github.sendMonitorDownAlert(testData);
```

---

## Cost Considerations

- **PagerDuty**: Free tier available, paid plans for advanced features
- **Discord**: Free for webhook usage
- **Twilio SMS**: Pay per message (~$0.0075 per SMS in US)
- **GitHub**: Free for public repos, included in GitHub Pro/Team plans

---

## Support

For issues with specific integrations:

- **PagerDuty**: [PagerDuty Support](https://support.pagerduty.com/)
- **Discord**: [Discord Developer Portal](https://discord.com/developers/docs)
- **Twilio**: [Twilio Support](https://support.twilio.com/)
- **GitHub**: [GitHub Support](https://support.github.com/)
