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
