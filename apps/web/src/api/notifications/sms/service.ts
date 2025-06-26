
export class SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendSMS(toNumber: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append("To", toNumber);
      formData.append("From", this.fromNumber);
      formData.append("Body", message);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twilio API responded with status ${response.status}: ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
      return false;
    }
  }
} 