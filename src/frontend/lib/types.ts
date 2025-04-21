export interface Link {
  id: string;
  slug: string;
  url: string;
  created_at: string;
  click_count: number;
  user_id: string;
  title?: string;
  description?: string;
}

export interface ApiLinksResponse {
  links: Link[];
}

export interface LinkAnalytic {
  id: string;
  request_url: string;
  shortened_path: string;
  slug: string;
  user_agent: string | null;
  referer: string | null;
  country_code: string | null;
  city: string | null;
  region_code: string | null;
  created_at: string;
  // Add other fields from link_analytics if needed
}

export interface ApiAnalyticsResponse {
  analytics: LinkAnalytic[];
}
