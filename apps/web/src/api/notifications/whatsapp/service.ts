export class WhatsAppService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendWhatsAppMessage(
    toNumber: string,
    message: string
  ): Promise<boolean> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append("To", `whatsapp:${toNumber}`);
      formData.append("From", `whatsapp:${this.fromNumber}`);
      formData.append("Body", message);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Twilio WhatsApp API responded with status ${response.status}: ${errorText}`
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
      return false;
    }
  }
}
