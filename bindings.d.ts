export interface EnvBindings {
  LINKS: KVNamespace;
  ASSETS: Fetcher;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  NAME: string;
  DATABASE_URL: string;
  CHECKER_DURABLE_OBJECT: DurableObjectNamespace<CheckerDurableObject>;
  RESEND_API_KEY: string;
  BROWSER: Fetcher;
}
