import { z } from "@hono/zod-openapi";

export const UUIDParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const MemberInviteSchema = z.object({
  email: z.email(),
  role: z.enum(["admin", "member", "viewer"]),
});

export const MemberUpdateSchema = z.object({
  id: z.uuid().optional(),
  email: z.email().optional(),
  role: z.enum(["admin", "member", "viewer"]),
  invitation_status: z.enum(["pending", "accepted", "declined"]).optional(),
  user_id: z.string().uuid().nullable().optional(),
});

export const WorkspaceCreateBodySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional(),
  members: z.array(MemberInviteSchema),
  creatorEmail: z.string(),
});

export const WorkspaceUpdateBodySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional(),
  members: z.array(MemberUpdateSchema),
});

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  role: z.enum(["admin", "member", "viewer"]),
  invitation_email: z.string().nullable(),
  invitation_status: z.enum(["pending", "accepted", "declined"]).nullable(),
});

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_by: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional(),
});

export const WorkspaceWithMembersSchema = WorkspaceSchema.extend({
  workspace_members: z.array(WorkspaceMemberSchema).nullable(),
});

export const NotificationUpdateSchema = z
  .object({
    email_enabled: z.boolean().optional(),

    slack_enabled: z.boolean().optional(),
    slack_webhook_url: z.url("Invalid Slack webhook URL").nullable().optional(),
    slack_channel: z.string().nullable().optional(),

    discord_enabled: z.boolean().optional(),
    discord_webhook_url: z
      .url("Invalid Discord webhook URL")
      .nullable()
      .optional(),
    discord_channel: z.string().nullable().optional(),

    pagerduty_enabled: z.boolean().optional(),
    pagerduty_service_id: z.string().nullable().optional(),
    pagerduty_api_key: z.string().nullable().optional(),
    pagerduty_from_email: z
      .email("Invalid email address")
      .nullable()
      .optional(),

    sms_enabled: z.boolean().optional(),
    sms_phone_numbers: z
      .array(z.string().regex(/^\+\d{1,15}$/, "Invalid phone number format"))
      .nullable()
      .optional(),
    twilio_account_sid: z.string().nullable().optional(),
    twilio_auth_token: z.string().nullable().optional(),
    twilio_from_number: z
      .string()
      .regex(/^\+\d{1,15}$/, "Invalid phone number format")
      .nullable()
      .optional(),

    github_enabled: z.boolean().optional(),
    github_owner: z.string().nullable().optional(),
    github_repo: z.string().nullable().optional(),
    github_token: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.slack_enabled && !data.slack_webhook_url) {
        return false;
      }
      return true;
    },
    {
      message:
        "Slack webhook URL is required when Slack notifications are enabled",
      path: ["slack_webhook_url"],
    }
  )
  .refine(
    (data) => {
      if (data.discord_enabled && !data.discord_webhook_url) {
        return false;
      }
      return true;
    },
    {
      message:
        "Discord webhook URL is required when Discord notifications are enabled",
      path: ["discord_webhook_url"],
    }
  )
  .refine(
    (data) => {
      if (
        data.pagerduty_enabled &&
        (!data.pagerduty_service_id ||
          !data.pagerduty_api_key ||
          !data.pagerduty_from_email)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "PagerDuty service ID, API key, and from email are required when PagerDuty notifications are enabled",
      path: ["pagerduty_service_id"],
    }
  )
  .refine(
    (data) => {
      if (
        data.github_enabled &&
        (!data.github_owner || !data.github_repo || !data.github_token)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "GitHub owner, repo, and token are required when GitHub notifications are enabled",
      path: ["github_owner"],
    }
  );

export const NotificationSchema = z.object({
  workspace_id: z.uuid(),
  email_enabled: z.boolean().nullable().optional(),
  slack_enabled: z.boolean().nullable().optional(),
  slack_webhook_url: z.string().nullable().optional(),
  slack_channel: z.string().nullable().optional(),
  discord_enabled: z.boolean().nullable().optional(),
  discord_webhook_url: z.string().nullable().optional(),
  discord_channel: z.string().nullable().optional(),
  pagerduty_enabled: z.boolean().nullable().optional(),
  pagerduty_service_id: z.string().nullable().optional(),
  pagerduty_api_key: z.string().nullable().optional(),
  pagerduty_from_email: z.string().nullable().optional(),
  sms_enabled: z.boolean().nullable().optional(),
  sms_phone_numbers: z.array(z.string()).nullable().optional(),
  twilio_account_sid: z.string().nullable().optional(),
  twilio_auth_token: z.string().nullable().optional(),
  twilio_from_number: z.string().nullable().optional(),
  whatsapp_enabled: z.boolean().nullable().optional(),
  whatsapp_phone_numbers: z.array(z.string()).nullable().optional(),
  github_enabled: z.boolean().nullable().optional(),
  github_owner: z.string().nullable().optional(),
  github_repo: z.string().nullable().optional(),
  github_token: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
