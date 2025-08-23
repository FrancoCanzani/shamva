import { createClient } from "@supabase/supabase-js";
import { env as globalEnv } from "cloudflare:workers";
import { EnvBindings } from "../../../../bindings";

const env = globalEnv as EnvBindings;

if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  throw new Error(
    "Supabase URL or Secret Key is missing in environment variables."
  );
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
