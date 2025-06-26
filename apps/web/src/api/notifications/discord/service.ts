
export class DiscordService {
  constructor() {}

  async sendMessage(
    webhookUrl: string,
    embed: {
      title: string;
      description: string;
      color: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
      timestamp?: string;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord API responded with status ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to send Discord notification:", error);
      return false;
    }
  }
} 