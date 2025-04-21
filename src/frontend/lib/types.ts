interface NestedLinkData {
  url: string;
  click_count: number;
}

export interface LinkAnalytic {
  slug: string;
  created_at: string;
  user_agent: string | null;
  country_code: string | null;
  continent_code: string | null;
  city: string | null;
  referer: string | null;
  links: NestedLinkData | null;
}

export interface ApiAnalyticsResponse {
  analytics: LinkAnalytic[];
}

export interface Link {
  id: string;
  slug: string;
  url: string;
  created_at: string;
  click_count: number;
  user_id: string;
  title?: string | null;
  description?: string | null;
  expires_at?: string | null;
  tags?: string[];
  is_active?: boolean;
}

export interface ApiLinksResponse {
  links: Link[];
}

export type DeviceType = "Desktop" | "Mobile" | "Tablet" | "Bot" | "Unknown";
