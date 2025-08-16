export interface EnvBindings {
  RATE_LIMITS: KVNamespace;
  ASSETS: Fetcher;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  NAME: string;
  DATABASE_URL: string;
  CHECKER_DURABLE_OBJECT: DurableObjectNamespace<CheckerDurableObject>;
  HTTP_CHECKER_DURABLE_OBJECT: DurableObjectNamespace<HttpCheckerDurableObject>;
  TCP_CHECKER_DURABLE_OBJECT: DurableObjectNamespace<TcpCheckerDurableObject>;
  RESEND_API_KEY: string;
  BROWSER: Fetcher;
  CLOUDFLARE_ACCOUNT_ID: string;
}
