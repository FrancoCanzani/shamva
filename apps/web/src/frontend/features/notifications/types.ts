export interface Notifications {
  id: string;
  workspace_id: string;
  
  // Email notifications (always enabled)
  email_enabled: boolean;
  
  // Slack
  slack_enabled: boolean;
  slack_webhook_url: string | null;
  slack_channel: string | null;
  
  // Discord  
  discord_enabled: boolean;
  discord_webhook_url: string | null;
  discord_channel: string | null;
  
  // PagerDuty
  pagerduty_enabled: boolean;
  pagerduty_service_id: string | null;
  pagerduty_api_key: string | null;
  pagerduty_from_email: string | null;
  
  // SMS
  sms_enabled: boolean;
  sms_phone_numbers: string[] | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_from_number: string | null;
  
  // WhatsApp
  whatsapp_enabled: boolean;
  whatsapp_phone_numbers: string[] | null;
  
  // GitHub
  github_enabled: boolean;
  github_owner: string | null;
  github_repo: string | null;
  github_token: string | null;
  
  created_at: string;
  updated_at: string;
}

export type Notification = 'email' | 'slack' | 'discord' | 'pagerduty' | 'sms' | 'whatsapp' | 'github';

export interface NotificationIntegration {
  id: Notification;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}
