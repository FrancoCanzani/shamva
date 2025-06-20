import { createClient } from "@supabase/supabase-js";
import { EnvBindings } from "../../../../bindings";

export const createSupabaseClient = (env: EnvBindings) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase URL or Anon Key is missing in environment variables."
    );
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
};
