export class PagerDutyService {
  private apiKey: string;
  private baseUrl = "https://api.pagerduty.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createIncident(
    serviceId: string,
    title: string,
    description: string,
    severity: "critical" | "warning" | "error" | "info" = "critical"
  ): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.pagerduty+json;version=2",
          Authorization: `Token token=${this.apiKey}`,
          From: "shamva-monitoring@yourdomain.com", // Replace with your email
        },
        body: JSON.stringify({
          incident: {
            type: "incident",
            title,
            service: {
              id: serviceId,
              type: "service_reference",
            },
            urgency: severity === "critical" ? "high" : "low",
            body: {
              type: "incident_body",
              details: description,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `PagerDuty API responded with status ${response.status}`
        );
      }

      const data = (await response.json()) as { incident: { id: string } };
      return data.incident.id;
    } catch (error) {
      console.error("Failed to create PagerDuty incident:", error);
      return null;
    }
  }

  async resolveIncident(incidentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/vnd.pagerduty+json;version=2",
          Authorization: `Token token=${this.apiKey}`,
          From: "shamva-monitoring@yourdomain.com", // Replace with your email
        },
        body: JSON.stringify({
          incident: {
            type: "incident",
            status: "resolved",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `PagerDuty API responded with status ${response.status}`
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to resolve PagerDuty incident:", error);
      return false;
    }
  }
}
