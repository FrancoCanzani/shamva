import { createClient } from "@supabase/supabase-js";
import { EnvBindings } from "../../../../bindings";

export const createSupabaseClient = (env: EnvBindings) => {
  return createClient(
    env.SUPABASE_URL ?? process.env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
  );
};
